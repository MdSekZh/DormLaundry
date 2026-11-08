#!/usr/bin/env python3
"""DormLaundry bridge for a TP-Link Tapo P110 smart plug (power metering).

Same job as shelly_bridge.py:
  - reads the power of the plug,
  - sends it to Supabase (device-telemetry function),
  - switches the plug ON/OFF as the server asks.
It fails safe: if the internet or the server is unreachable the plug is left
as it is, and a load above RUNNING_GUARD_W blocks every OFF command.

Usage (from the folder device-agent, plug and computer on the same Wi-Fi):
    py -m pip install python-kasa
    copy .env.tapo.example .env       (then fill in the values)
    py tapo_bridge.py test            check connection, power and ON/OFF (do this first)
    py tapo_bridge.py                 run the bridge (keep the window open)

NOTE: written without access to a real P110 - run "test" first.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from kasa import Credentials, Discover


def load_env_file() -> None:
    """Tiny .env reader (KEY=value lines) so no extra package is needed."""
    path = Path(__file__).with_name(".env")
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


load_env_file()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
LOG = logging.getLogger("dormlaundry-tapo")


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing value {name}. Fill it in the .env file (see .env.tapo.example).")
    return value


TAPO_HOST = required("TAPO_HOST")
TAPO_EMAIL = required("TAPO_EMAIL")
TAPO_PASSWORD = required("TAPO_PASSWORD")
POLL_SECONDS = max(2, int(os.getenv("POLL_SECONDS", "5")))
RUNNING_GUARD_W = max(1.0, float(os.getenv("RUNNING_GUARD_W", "5")))
HTTP_TIMEOUT = max(2.0, float(os.getenv("HTTP_TIMEOUT", "8")))


async def connect():
    return await Discover.discover_single(
        TAPO_HOST, credentials=Credentials(TAPO_EMAIL, TAPO_PASSWORD)
    )


async def read_status(plug) -> dict:
    await plug.update()
    power = None
    try:  # python-kasa 0.7+
        from kasa import Module

        energy = plug.modules.get(Module.Energy)
        if energy is not None:
            power = energy.current_consumption
    except Exception:
        pass
    if power is None:  # older versions
        try:
            power = plug.emeter_realtime.power
        except Exception:
            power = 0
    return {"power_watts": max(0.0, float(power or 0)), "relay_on": bool(plug.is_on)}


def send_telemetry(status: dict) -> dict:
    device_id = required("DEVICE_ID")
    token = required("DEVICE_TOKEN")
    body = json.dumps({**status, "device_id": device_id, "online": True}).encode()
    request = urllib.request.Request(
        required("SUPABASE_FUNCTION_URL"),
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "x-device-id": device_id,
            "x-device-token": token,
        },
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
        return json.loads(response.read().decode() or "{}")


async def reconcile_once(plug) -> None:
    status = await read_status(plug)
    decision = send_telemetry(status)
    desired_on = bool(decision.get("desired_relay_on", True))

    if not desired_on and status["power_watts"] >= RUNNING_GUARD_W:
        LOG.warning("OFF blocked: load is %.1f W (guard %.1f W)", status["power_watts"], RUNNING_GUARD_W)
        desired_on = True

    if desired_on != status["relay_on"]:
        await (plug.turn_on() if desired_on else plug.turn_off())
        LOG.info("Plug switched %s: %s", "ON" if desired_on else "OFF", decision.get("reason", "server request"))
    else:
        LOG.info(
            "%.1f W | plug %s | machine %s",
            status["power_watts"],
            "ON" if status["relay_on"] else "OFF",
            decision.get("machine_status", "unknown"),
        )


async def run() -> None:
    plug = await connect()
    LOG.info("Connected to %s (%s). Polling every %s s. Ctrl+C to stop.", TAPO_HOST, plug.alias, POLL_SECONDS)
    while True:
        try:
            await reconcile_once(plug)
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            LOG.error("Server problem, plug left unchanged: %s", error)
        except Exception:
            LOG.exception("Plug problem, trying again")
            try:
                plug = await connect()
            except Exception:
                pass
        await asyncio.sleep(POLL_SECONDS)


async def self_test() -> None:
    plug = await connect()
    status = await read_status(plug)
    print(f"Connected: {plug.alias}")
    print(f"Power: {status['power_watts']:.1f} W, plug is {'ON' if status['relay_on'] else 'OFF'}")
    print("Switching OFF for 3 seconds, then ON again...")
    await plug.turn_off()
    await asyncio.sleep(3)
    await plug.turn_on()
    print("Test finished. If the plug clicked off and on, the connection works.")


if __name__ == "__main__":
    try:
        asyncio.run(self_test() if "test" in sys.argv[1:] else run())
    except KeyboardInterrupt:
        print("\nStopped.")
