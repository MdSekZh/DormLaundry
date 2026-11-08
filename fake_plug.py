"""Smart-plug simulator for DormLaundry (one or more washers).

  py fake_plug.py        start the plug; it behaves like a real plug:
  py fake_plug.py wash   same, but the first washer starts a washing cycle at once (quick test)

How the plug behaves
  - Normally the outlet is ON and the plug is Online (about 0.3 W, nothing running).
  - When the washer is booked and the server asks for the outlet OFF, the plug
    switches OFF and reports 0 W.
  - When the owner presses "Start washer" the server asks for ON; the plug
    switches ON, and then starts a washing cycle (150 W for RUN_SECONDS).
    The server sees the power and shows the washer as "In use" for everybody.
  - After the cycle the plug stays ON and Online (idle) until you press Ctrl+C.
  - A device marked "always_running": True keeps drawing 120-170 W (a washer in use
    without any booking).

To simulate more washers, add one entry per registered device to devices.json.
"""
import json, random, sys, time, urllib.request, urllib.error

import os

# Settings are read from devices.json (not committed to git, see devices.example.json).
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "devices.json")
try:
    with open(CONFIG_FILE, encoding="utf-8") as f:
        _cfg = json.load(f)
except FileNotFoundError:
    sys.exit("devices.json not found. Copy devices.example.json to devices.json and fill in the "
             "device ids and tokens printed by supabase/rotate_plug_tokens.sql.")

URL = _cfg["url"]
DEVICES = _cfg["devices"]   # each: name, id, token, optional always_running
skipped = [d["name"] for d in DEVICES if d["id"].startswith("PASTE")]
DEVICES = [d for d in DEVICES if not d["id"].startswith("PASTE")]
if skipped:
    print("Skipped (id/token not pasted yet):", ", ".join(skipped))

RUN_SECONDS = 90      # length of a washing cycle at 150 W
STEP = 5              # send every 5 seconds
BUSY = ("starting", "in_use")

state = {
    d["id"]: {"relay": True, "prev": None, "wash_until": 0.0, "always": bool(d.get("always_running"))}
    for d in DEVICES
}


def power_now(st):
    if not st["relay"]:
        return 0.0                      # a switched-off outlet draws nothing
    if st["always"]:
        return round(random.uniform(120, 170), 1)   # someone is washing, no end in sight
    return 150.0 if time.time() < st["wash_until"] else 0.3


def send(dev):
    st = state[dev["id"]]
    on = st["relay"]
    watts = power_now(st)
    body = json.dumps({
        "device_id": dev["id"],
        "power_watts": watts,
        "relay_on": on,
        "online": True,
    }).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {dev['token']}",
        "x-device-id": dev["id"],
        "x-device-token": dev["token"],
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        print(f"{dev['name']}: ERROR {e.code} {e.read().decode()[:200]}")
        return
    except Exception as e:  # network problem: keep going
        print(f"{dev['name']}: network error {e}")
        return

    status = data.get("machine_status")
    desired = data.get("desired_relay_on")
    if isinstance(desired, bool):
        st["relay"] = desired                      # obey the server
    # The owner pressed "Start washer": the server says "starting" -> run a cycle.
    if status == "starting" and st["prev"] not in BUSY and st["relay"]:
        st["wash_until"] = time.time() + RUN_SECONDS
        print(f"{dev['name']}: Start pressed -> washing for {RUN_SECONDS} s")
    st["prev"] = status
    print(f"{dev['name']}: {watts:>6.1f} W, outlet {'ON' if on else 'OFF'} -> server status={status}, "
          f"next outlet={'ON' if st['relay'] else 'OFF'}")


try:
    if "wash" in sys.argv[1:]:
        state[DEVICES[0]["id"]]["wash_until"] = time.time() + RUN_SECONDS
        print("Quick test: washing cycle starts now.")
    print("Plug online (outlet ON). Press Ctrl+C to stop.")
    while True:
        for dev in DEVICES:
            send(dev)
        time.sleep(STEP)
except KeyboardInterrupt:
    print("\nStopped.")
