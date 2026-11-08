#!/usr/bin/env python3
"""DormLaundry bridge for a Shelly Gen2/Gen3 plug with power metering.

The bridge stays on the laundry-room network, reads Switch.GetStatus, sends
telemetry to Supabase, and applies the returned desired relay state. It fails
safe: loss of cloud connectivity never switches the outlet off, and a measured
load above RUNNING_GUARD_W blocks every OFF command.
"""

from __future__ import annotations

import json
import logging
import os
import signal
import time
import urllib.error
import urllib.request


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
LOG = logging.getLogger("dormlaundry-bridge")
RUNNING = True


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


SHELLY_URL = required("SHELLY_URL").rstrip("/")
FUNCTION_URL = required("SUPABASE_FUNCTION_URL")
DEVICE_ID = required("DEVICE_ID")
DEVICE_TOKEN = required("DEVICE_TOKEN")
POLL_SECONDS = max(5, int(os.getenv("POLL_SECONDS", "15")))
RUNNING_GUARD_W = max(1.0, float(os.getenv("RUNNING_GUARD_W", "5")))
HTTP_TIMEOUT = max(2.0, float(os.getenv("HTTP_TIMEOUT", "8")))


def request_json(url: str, *, method: str = "GET", body: dict | None = None, headers: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Accept", "application/json")
    if data is not None:
        request.add_header("Content-Type", "application/json")
    for name, value in (headers or {}).items():
        request.add_header(name, value)
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def get_plug_status() -> dict:
    status = request_json(f"{SHELLY_URL}/rpc/Switch.GetStatus?id=0")
    return {
        "power_watts": max(0.0, float(status.get("apower") or 0)),
        "voltage": None if status.get("voltage") is None else float(status["voltage"]),
        "current_amps": None if status.get("current") is None else float(status["current"]),
        "relay_on": bool(status.get("output")),
    }


def send_telemetry(status: dict) -> dict:
    return request_json(
        FUNCTION_URL,
        method="POST",
        body=status,
        headers={"X-Device-Id": DEVICE_ID, "X-Device-Token": DEVICE_TOKEN},
    )


def set_relay(desired_on: bool) -> None:
    request_json(
        f"{SHELLY_URL}/rpc/Switch.Set",
        method="POST",
        body={"id": 0, "on": desired_on},
    )


def reconcile_once() -> None:
    status = get_plug_status()
    decision = send_telemetry(status)
    desired_on = bool(decision.get("desired_relay_on", True))

    if not desired_on and status["power_watts"] >= RUNNING_GUARD_W:
        LOG.warning(
            "OFF blocked: washer is drawing %.1f W (guard %.1f W)",
            status["power_watts"],
            RUNNING_GUARD_W,
        )
        desired_on = True

    if desired_on != status["relay_on"]:
        set_relay(desired_on)
        LOG.info("Relay changed to %s: %s", "ON" if desired_on else "OFF", decision.get("reason", "policy"))
    else:
        LOG.info(
            "%.1f W | relay %s | machine %s",
            status["power_watts"],
            "ON" if status["relay_on"] else "OFF",
            decision.get("machine_status", "unknown"),
        )


def stop(_signum: int, _frame: object) -> None:
    global RUNNING
    RUNNING = False


def main() -> None:
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    LOG.info("DormLaundry bridge started; polling every %s seconds", POLL_SECONDS)
    while RUNNING:
        started = time.monotonic()
        try:
            reconcile_once()
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            LOG.error("Bridge cycle failed; relay left unchanged: %s", error)
        except Exception:
            LOG.exception("Unexpected bridge error; relay left unchanged")
        elapsed = time.monotonic() - started
        time.sleep(max(1, POLL_SECONDS - elapsed))


if __name__ == "__main__":
    main()
