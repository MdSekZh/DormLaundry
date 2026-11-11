(() => {
  "use strict";

  const config = window.DORMLAUNDRY_CONFIG || {};
  const isLive = config.DATA_MODE === "live" && Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);

  const STORAGE = {
    data: "dormlaundry.smart.demo.data.v2",
    session: "dormlaundry.smart.session.v2",
  };

  const STATUS_LABELS = {
    available: "Available",
    reserved: "Reserved",
    starting: "Starting",
    in_use: "In use",
    out_of_service: "Out of service",
    offline: "Offline",
    scheduled: "Scheduled",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    missed: "Missed",
    open: "Open",
    pending: "In progress",
    resolved: "Resolved",
    confirmed: "Confirmed",
  };

  const icons = {
    washer: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="5" width="32" height="38" rx="4"></rect><path d="M8 14h32"></path><circle cx="24" cy="28" r="10"></circle><path d="M16.5 28c3-3 6 3 10 0 2-1.4 3.6-1.5 5-.8"></path><path d="M14 9h.01M19 9h.01"></path></svg>`,
    booking: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18"></path><path d="m8 15 2 2 5-5"></path></svg>`,
    fault: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg>`,
    empty: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z"></path><path d="M8 4h8v3M8 12h8M8 16h5"></path></svg>`,
    success: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path></svg>`,
    machine: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"></rect><path d="M4 7h16"></path><circle cx="12" cy="14" r="5"></circle></svg>`,
    users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path></svg>`,
  };

  const app = document.querySelector("#app");
  const logoutButton = document.querySelector("#logoutButton");
  const modeBadge = document.querySelector("#modeBadge");
  const helpButton = document.querySelector("#helpButton");
  const dialog = document.querySelector("#appDialog");
  const dialogForm = document.querySelector("#dialogForm");
  const dialogTitle = document.querySelector("#dialogTitle");
  const dialogEyebrow = document.querySelector("#dialogEyebrow");
  const dialogBody = document.querySelector("#dialogBody");
  const dialogActions = document.querySelector("#dialogActions");
  const toastRegion = document.querySelector("#toastRegion");

  const state = {
    user: null,
    token: null,
    role: "resident",
    adminTab: "machines",
    machines: [],
    bookings: [],
    faults: [],
    busy: false,
  };

  const demoSeed = {
    machines: [
      {
        machine_id: 1,
        machine_name: "Washer 1",
        status: "available",
        location: "Main Dormitory Laundry Room",
        power_watts: 0.4,
        relay_state: true,
        desired_relay_state: true,
        last_seen_at: new Date().toISOString(),
      },
      {
        machine_id: 2,
        machine_name: "Washer 2",
        status: "in_use",
        location: "Main Dormitory Laundry Room",
        power_watts: 486.2,
        relay_state: true,
        desired_relay_state: true,
        last_seen_at: new Date().toISOString(),
      },
      {
        machine_id: 3,
        machine_name: "Washer 3",
        status: "reserved",
        location: "Main Dormitory Laundry Room",
        power_watts: 0,
        relay_state: false,
        desired_relay_state: false,
        last_seen_at: new Date().toISOString(),
      },
    ],
    bookings: [
      {
        booking_id: "demo-booking-ready",
        user_id: "demo-resident",
        machine_id: 3,
        slot_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 115 * 60 * 1000).toISOString(),
        status: "scheduled",
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ],
    faults: [
      {
        report_id: "demo-fault-1",
        machine_id: 2,
        user_id: "demo-resident",
        description: "The machine makes a loud noise during the spin cycle.",
        status: "open",
        reported_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        report_id: "demo-fault-2",
        machine_id: 1,
        user_id: "demo-resident",
        description: "The door did not lock after loading.",
        status: "resolved",
        reported_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        responded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        resolved_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        admin_response: "The door latch was replaced. Thank you for letting us know.",
      },
    ],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeStatus(value) {
    return String(value || "available").trim().toLowerCase().replaceAll(" ", "_");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function initials(email) {
    return String(email || "DL")
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DL";
  }

  function formatDate(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function bookingDateBlock(iso) {
    const date = new Date(iso);
    const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
    return `<div class="booking-date"><strong>${day}</strong><small>${month}</small></div>`;
  }

  function showToast(title, message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.dataset.type = type;
    toast.innerHTML = `${type === "error" ? icons.fault : icons.success}<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`;
    toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 4200);
  }

  function getDemoData() {
    const saved = localStorage.getItem(STORAGE.data);
    if (!saved) {
      const data = clone(demoSeed);
      localStorage.setItem(STORAGE.data, JSON.stringify(data));
      return data;
    }
    try {
      return JSON.parse(saved);
    } catch {
      const data = clone(demoSeed);
      localStorage.setItem(STORAGE.data, JSON.stringify(data));
      return data;
    }
  }

  function saveDemoData() {
    localStorage.setItem(
      STORAGE.data,
      JSON.stringify({ machines: state.machines, bookings: state.bookings, faults: state.faults }),
    );
  }

  async function api(path, options = {}) {
    const url = `${String(config.SUPABASE_URL).replace(/\/$/, "")}${path}`;
    const headers = {
      apikey: config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!response.ok) {
      throw new Error(body?.message || body?.msg || body?.error_description || body?.error || body?.hint || `Request failed (${response.status})`);
    }
    return body;
  }

  async function signInLive(email, password) {
    const body = await api("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    state.token = body.access_token;
    const user = body.user;
    const profiles = await api(`/rest/v1/users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,email,role&limit=1`);
    const profile = profiles?.[0] || {};
    state.user = { id: user.id, email: profile.email || user.email };
    state.role = profile.role === "admin" ? "admin" : "resident";
    localStorage.setItem(
      STORAGE.session,
      JSON.stringify({ token: state.token, user: state.user, role: state.role }),
    );
  }

  async function loadData() {
    if (!isLive) {
      const data = getDemoData();
      state.machines = data.machines.map((item) => ({
        power_watts: 0,
        relay_state: true,
        desired_relay_state: true,
        last_seen_at: new Date().toISOString(),
        ...item,
        status: normalizeStatus(item.status),
      }));
      state.bookings = data.bookings.map((item) => ({
        status: "scheduled",
        ends_at: new Date(new Date(item.slot_time).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        ...item,
      }));
      state.faults = data.faults.map((item) => ({ ...item, status: normalizeStatus(item.status) }));
      return;
    }

    state.busySlots = [];
    if (state.role !== "admin") {
      try {
        // R2: anonymous booked time ranges of all residents (no user_id), from a SECURITY DEFINER function
        state.busySlots = (await api("/rest/v1/rpc/machine_busy_slots", { method: "POST", body: "{}" })) || [];
      } catch {
        state.busySlots = []; // function not installed yet: fall back to own bookings only
      }
    }

    const bookingFilter = state.role === "admin" ? "" : `&user_id=eq.${encodeURIComponent(state.user.id)}`;
    const [machines, bookings, faults] = await Promise.all([
      api("/rest/v1/machines?select=*&order=machine_id.asc"),
      api(`/rest/v1/bookings?select=*&order=slot_time.asc${bookingFilter}`),
      api(`/rest/v1/fault_reports?select=*&order=reported_at.desc`),
    ]);
    state.machines = machines.map((item) => ({ ...item, status: normalizeStatus(item.status) }));
    state.bookings = bookings;
    state.faults = faults.map((item) => ({ ...item, status: normalizeStatus(item.status) }));
  }

  function machineById(machineId) {
    return state.machines.find((item) => String(item.machine_id) === String(machineId));
  }

  function activeBookings() {
    return state.bookings
      .filter((item) => !["completed", "cancelled", "missed"].includes(normalizeStatus(item.status || "scheduled")))
      .filter((item) => new Date(item.ends_at || item.slot_time).getTime() > Date.now())
      .sort((a, b) => new Date(a.slot_time) - new Date(b.slot_time));
  }

  function plugOnline(machine) {
    if (!machine.last_seen_at) return false;
    return Date.now() - new Date(machine.last_seen_at).getTime() < 90 * 1000;
  }

  // ---- Booking time rules --------------------------------------------------
  const EARLY_START_MS = 15 * 60 * 1000; // the owner may start the washer up to 15 min before the slot

  function bookingWindow(booking) {
    const start = new Date(booking.slot_time).getTime();
    const end = new Date(booking.ends_at || start + 2 * 60 * 60 * 1000).getTime();
    return { start, end };
  }

  // True while the owner is allowed to start: from 15 min before the slot until it ends.
  function bookingOpen(booking) {
    const { start, end } = bookingWindow(booking);
    const now = Date.now();
    return now >= start - EARLY_START_MS && now < end;
  }

  function formatTime(ms) {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
  }

  function bookingConflict(machineId, startMs, endMs, ignoreId = null) {
    const ignored = ignoreId ? state.bookings.find((item) => String(item.booking_id) === String(ignoreId)) : null;
    const own = state.bookings.find((item) => {
      if (String(item.booking_id) === String(ignoreId)) return false;
      if (String(item.machine_id) !== String(machineId)) return false;
      if (["completed", "cancelled", "missed"].includes(normalizeStatus(item.status || "scheduled"))) return false;
      const { start, end } = bookingWindow(item);
      return startMs < end && endMs > start;
    });
    if (own) return own;
    // other residents' bookings (anonymous time ranges)
    return (state.busySlots || []).find((slot) => {
      if (String(slot.machine_id) !== String(machineId)) return false;
      const start = new Date(slot.slot_time).getTime();
      const end = new Date(slot.ends_at).getTime();
      if (ignored && new Date(ignored.slot_time).getTime() === start && String(ignored.machine_id) === String(slot.machine_id)) return false;
      return startMs < end && endMs > start;
    });
  }

  // Booked time ranges of one washer (anonymous): own bookings + other residents' ranges.
  function busyRanges(machineId, ignoreId = null) {
    const seen = new Set();
    const list = [];
    const add = (slotTime, endsAt) => {
      const start = new Date(slotTime).getTime();
      const end = new Date(endsAt || start + 2 * 60 * 60 * 1000).getTime();
      if (end <= Date.now()) return;
      const key = `${start}-${end}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ start, end });
    };
    state.bookings.forEach((item) => {
      if (String(item.machine_id) !== String(machineId)) return;
      if (String(item.booking_id) === String(ignoreId)) return;
      if (!["scheduled", "active"].includes(normalizeStatus(item.status || "scheduled"))) return;
      add(item.slot_time, item.ends_at);
    });
    (state.busySlots || []).forEach((slot) => {
      if (String(slot.machine_id) !== String(machineId)) return;
      add(slot.slot_time, slot.ends_at);
    });
    return list.sort((a, b) => a.start - b.start);
  }

  function busyRangesHtml(machineId, ignoreId = null) {
    const ranges = busyRanges(machineId, ignoreId);
    if (!ranges.length) return `<p class="busy-ranges">No bookings yet for this washer: every time is free.</p>`;
    return `<div class="busy-ranges"><strong>Already booked</strong><ul>${ranges.map((r) => `<li>${escapeHtml(formatDate(new Date(r.start).toISOString()))} – ${escapeHtml(formatTime(r.end))}</li>`).join("")}</ul></div>`;
  }

  // Same rule as the database function process_device_telemetry: a free washer whose booked
  // slot has begun (slot_time <= now < ends_at) is "Reserved" and its outlet is held OFF.
  function effectiveMachine(machine) {
    if (normalizeStatus(machine.status) !== "available") return machine;
    const held = state.bookings.find(
      (item) =>
        String(item.machine_id) === String(machine.machine_id) &&
        normalizeStatus(item.status || "scheduled") === "scheduled" &&
        Date.now() >= bookingWindow(item).start &&
        Date.now() < bookingWindow(item).end,
    );
    return held ? { ...machine, status: "reserved", relay_state: false, held } : machine;
  }

  function machineHint(machine, status) {
    if (status === "in_use" || status === "starting") {
      const now = Date.now();
      const current = state.bookings.find((item) => {
        if (String(item.machine_id) !== String(machine.machine_id)) return false;
        if (!["scheduled", "active"].includes(normalizeStatus(item.status || "scheduled"))) return false;
        const { start, end } = bookingWindow(item);
        return now >= start - EARLY_START_MS && now < end;
      });
      const when = current
        ? `In use. Booked until ${formatTime(bookingWindow(current).end)}.`
        : "In use without a booking. Finish time unknown.";
      const signal = plugOnline(machine) ? "" : " No signal from the plug: last known state.";
      return `<p class="machine-hint">${when} Booking reopens when the cycle ends.${signal}</p>`;
    }
    if (status === "reserved") {
      const until = machine.held ? ` until ${formatTime(bookingWindow(machine.held).end)}` : "";
      return `<p class="machine-hint">On hold for a booking${until}. The outlet stays off until the owner starts the washer.</p>`;
    }
    return "";
  }

  function nextBookingFor(machineId) {
    return activeBookings().find((item) => String(item.machine_id) === String(machineId));
  }

  function userChip() {
    return `<div class="user-chip"><span class="avatar">${escapeHtml(initials(state.user?.email))}</span><span><strong>${escapeHtml(state.user?.email)}</strong><small>${state.role === "admin" ? "Administrator" : "Resident"}</small></span></div>`;
  }

  // Preview of the booking screen. Optimised: WebP, 360 px + 720 px (for 2x screens).
  // Open the site with ?before to load the original 1088 px PNG instead (for the before/after measurement).
  function introFigure() {
    const alt = "Screenshot of the Resident booking screen: three washers, each marked Available, with a Choose a time button.";
    const img = (window.DORMLAUNDRY_BEFORE === true || new URLSearchParams(window.location.search).has("before"))
      ? `<img src="./img/prototype.png" width="1088" height="839" alt="${alt}" />`
      : `<img src="./media/prototype-360.webp" srcset="./media/prototype-360.webp 360w, ./media/prototype-720.webp 720w" sizes="360px" width="360" height="278" alt="${alt}" decoding="async" />`;
    return `<figure class="intro-figure">${img}<figcaption>Preview of the booking screen.</figcaption></figure>`;
  }

  function renderLogin() {
    logoutButton.classList.add("is-hidden");
    renderBell();
    app.innerHTML = `
      <section class="login-layout" aria-labelledby="welcomeTitle">
        <div class="intro-panel">
          <p class="eyebrow">University dormitory service</p>
          <h1 id="welcomeTitle">Laundry without the waiting.</h1>
          <p class="intro-copy">Check machine status before walking downstairs, reserve a fair time and report faults from one clear screen.</p>
          <ul class="feature-list">
            <li>${icons.booking}<span>Reserve an available washer in under a minute</span></li>
            <li>${icons.machine}<span>See live availability and your next booking</span></li>
            <li>${icons.fault}<span>Report a problem directly to the administrator</span></li>
          </ul>
          ${introFigure()}
        </div>
        <form id="loginForm" class="login-card">
          <p class="eyebrow">${isLive ? "Secure Supabase sign-in" : "Interactive demonstration"}</p>
          <h2>Welcome back</h2>
          <p>Use your university email to enter the laundry room service.</p>
          <div class="field">
            <label for="email">University email</label>
            <input id="email" name="email" type="email" value="student@university.edu" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" value="demo1234" autocomplete="current-password" minlength="6" required />
          </div>
          <div class="field ${isLive ? "is-hidden" : ""}">
            <span class="field-label">Demo role</span>
            <div class="segmented" role="group" aria-label="Choose demo role">
              <button type="button" class="is-active" data-role="resident">Resident</button>
              <button type="button" data-role="admin">Administrator</button>
            </div>
          </div>
          <button class="primary-button login-submit" type="submit">Sign in</button>
          <p class="login-note">
            ${icons.success}
            <span>${isLive ? "Credentials are sent directly to Supabase Auth. The site never stores your password." : "Demo mode works locally and stores only sample data in this browser. Choose either role to test every screen."}</span>
          </p>
        </form>
      </section>`;

    let selectedRole = "resident";
    app.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedRole = button.dataset.role;
        app.querySelectorAll("[data-role]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    app.querySelector("#loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy) return;
      state.busy = true;
      const submit = event.currentTarget.querySelector("button[type=submit]");
      submit.disabled = true;
      submit.textContent = "Signing in...";
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email")).trim();
      const password = String(form.get("password"));
      try {
        if (isLive) {
          await signInLive(email, password);
        } else {
          state.user = { id: selectedRole === "admin" ? "demo-admin" : "demo-resident", email };
          state.role = selectedRole;
          localStorage.setItem(STORAGE.session, JSON.stringify({ user: state.user, role: state.role }));
        }
        await loadData();
        renderApp();
        showToast("Signed in", `You are viewing the ${state.role} workspace.`);
      } catch (error) {
        showToast("Sign-in failed", error.message, "error");
      } finally {
        state.busy = false;
        submit.disabled = false;
        submit.textContent = "Sign in";
      }
    });
  }

  function renderApp() {
    logoutButton.classList.remove("is-hidden");
    renderBell();
    if (state.role === "admin") renderAdmin();
    else renderResident();
  }

  function machineCard(rawMachine) {
    const machine = effectiveMachine(rawMachine);
    const status = normalizeStatus(machine.status);
    const next = nextBookingFor(machine.machine_id);
    const canBook = status === "available";
    const online = plugOnline(machine);
    const power = Number(machine.power_watts || 0);
    return `
      <article class="machine-card" data-status="${escapeHtml(status)}">
        <div class="machine-top">
          <div class="machine-visual">${icons.washer}</div>
          <span class="status-pill" data-status="${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] || machine.status)}</span>
        </div>
        <h3>${escapeHtml(machine.machine_name)}</h3>
        <p class="machine-location">${escapeHtml(machine.location || "Main Dormitory Laundry Room")}</p>
        <div class="smart-meter" aria-label="Smart plug telemetry">
          <span><small>Power</small><strong>${online ? `${escapeHtml(power.toFixed(1))} W` : "–"}</strong></span>
          <span><small>Outlet</small><strong class="relay-state" data-on="${Boolean(machine.relay_state)}">${machine.relay_state ? "ON" : "OFF"}</strong></span>
          <span><small>Device</small><strong class="device-state" data-online="${online}">${online ? "Online" : "Offline"}</strong></span>
        </div>
        <div class="next-slot"><span>Next booking</span><strong>${next ? escapeHtml(formatDate(next.slot_time)) : "No booking"}</strong></div>
        ${machineHint(machine, status)}
        <button class="${canBook ? "primary-button" : "secondary-button"}" type="button" data-book-machine="${escapeHtml(machine.machine_id)}" ${canBook ? "" : "disabled"}>
          ${canBook ? "Choose a time" : (STATUS_LABELS[status] || "Unavailable")}
        </button>
        ${historyLink(machine.machine_id)}
      </article>`;
  }

  function renderResident() {
    const mine = activeBookings().filter((item) => !isLive || String(item.user_id) === String(state.user.id));
    app.innerHTML = `
      <section class="page-head">
        <div class="page-title">
          <p class="eyebrow">Resident booking</p>
          <h1>Choose a washer</h1>
          <p>Availability is visible before you walk to the laundry room.</p>
        </div>
        ${userChip()}
      </section>

      <section aria-labelledby="machinesTitle">
        <div class="section-head">
          <div><h2 id="machinesTitle">Machines</h2><p>${state.machines.length} washers in Main Dormitory Laundry Room</p></div>
        </div>
        <div class="machine-grid">${state.machines.map(machineCard).join("")}</div>
      </section>

      <section class="split-layout">
        <div>
          <div class="section-head"><div><h2>My bookings</h2><p>Upcoming reservations linked to your account</p></div></div>
          <div class="panel booking-list">
            ${mine.length ? mine.map(bookingRow).join("") : `<div class="empty-state">${icons.empty}<div>No upcoming bookings yet.</div></div>`}
          </div>
        </div>
        <div>
          <div class="section-head"><div><h2>Need help?</h2><p>Send a fault to the administrator</p></div></div>
          <aside class="quick-card">
            <h2>Something is wrong?</h2>
            <p>Describe the problem and select the washer. The laundry administrator will see the report.</p>
            <button id="reportFaultButton" class="secondary-button" type="button">Report a fault</button>
            <button id="myReportsButton" class="secondary-button" type="button">My reports${myReportCount()}</button>
          </aside>
        </div>
      </section>`;

    app.querySelectorAll("[data-book-machine]").forEach((button) => {
      button.addEventListener("click", () => openBookingDialog(button.dataset.bookMachine));
    });
    app.querySelectorAll("[data-cancel-booking]").forEach((button) => {
      button.addEventListener("click", () => openCancelDialog(button.dataset.cancelBooking));
    });
    app.querySelectorAll("[data-reschedule-booking]").forEach((button) => {
      button.addEventListener("click", () => openRescheduleDialog(button.dataset.rescheduleBooking));
    });
    app.querySelectorAll("[data-start-booking]").forEach((button) => {
      button.addEventListener("click", () => startBooking(button.dataset.startBooking));
    });
    app.querySelectorAll("[data-finish-demo]").forEach((button) => {
      button.addEventListener("click", () => finishDemoCycle(button.dataset.finishDemo));
    });
    app.querySelector("#reportFaultButton").addEventListener("click", () => openFaultDialog());
    app.querySelector("#myReportsButton").addEventListener("click", openMyReportsDialog);
    app.querySelectorAll("[data-machine-reports]").forEach((button) => {
      button.addEventListener("click", () => openMachineReportsDialog(button.dataset.machineReports));
    });
  }

  function bookingRow(booking) {
    const machine = machineById(booking.machine_id);
    const status = normalizeStatus(booking.status || "scheduled");
    const canStart = status === "scheduled";
    return `
      <article class="booking-row">
        ${bookingDateBlock(booking.slot_time)}
        <div><h3>${escapeHtml(machine?.machine_name || `Machine ${booking.machine_id}`)} <span class="booking-status">${escapeHtml(STATUS_LABELS[status] || status)}</span></h3><p>${escapeHtml(formatDate(booking.slot_time))} · ${escapeHtml(machine?.location || "Laundry room")}</p></div>
        <div class="booking-actions">
          ${canStart ? (bookingOpen(booking)
            ? `<button class="primary-button" type="button" data-start-booking="${escapeHtml(booking.booking_id)}">Start washer</button>`
            : `<button class="secondary-button" type="button" disabled>${bookingWindow(booking).end <= Date.now() ? "Expired" : `Opens ${escapeHtml(formatTime(bookingWindow(booking).start - EARLY_START_MS))}`}</button>`) : ""}
          ${!isLive && status === "active" ? `<button class="secondary-button" type="button" data-finish-demo="${escapeHtml(booking.booking_id)}">Finish demo cycle</button>` : ""}
          ${canStart ? `<button class="secondary-button" type="button" data-reschedule-booking="${escapeHtml(booking.booking_id)}">Reschedule</button>` : ""}
          ${canStart ? `<button class="secondary-button" type="button" data-cancel-booking="${escapeHtml(booking.booking_id)}">Cancel</button>` : ""}
        </div>
      </article>`;
  }

  async function startBooking(bookingId) {
    if (state.busy) return;
    state.busy = true;
    try {
      const booking = state.bookings.find((item) => String(item.booking_id) === String(bookingId));
      if (!booking) throw new Error("Booking not found.");
      if (isLive) {
        await api("/functions/v1/booking-control", {
          method: "POST",
          body: JSON.stringify({ booking_id: bookingId }),
        });
        await loadData();
      } else {
        booking.status = "active";
        booking.started_at = new Date().toISOString();
        const machine = machineById(booking.machine_id);
        if (machine) {
          machine.status = "starting";
          machine.desired_relay_state = true;
          machine.relay_state = true;
          machine.power_watts = 2.1;
          machine.last_seen_at = new Date().toISOString();
        }
        saveDemoData();
        window.setTimeout(() => {
          const currentMachine = machineById(booking.machine_id);
          if (!currentMachine || normalizeStatus(booking.status) !== "active") return;
          currentMachine.status = "in_use";
          currentMachine.power_watts = 512.8;
          currentMachine.last_seen_at = new Date().toISOString();
          saveDemoData();
          renderResident();
          showToast("Power detected", "The smart plug changed the washer status to In use.");
        }, 1400);
      }
      renderResident();
      showToast("Outlet enabled", "The booking owner can now start the washer.");
    } catch (error) {
      showToast("Could not start", error.message, "error");
    } finally {
      state.busy = false;
    }
  }

  function finishDemoCycle(bookingId) {
    const booking = state.bookings.find((item) => String(item.booking_id) === String(bookingId));
    if (!booking) return;
    booking.status = "completed";
    booking.completed_at = new Date().toISOString();
    const machine = machineById(booking.machine_id);
    if (machine) {
      machine.status = "available";
      machine.power_watts = 0.3;
      machine.relay_state = true;
      machine.desired_relay_state = true;
      machine.last_seen_at = new Date().toISOString();
    }
    saveDemoData();
    renderResident();
    showToast("Cycle completed", "Power dropped and the outlet remains on because there is no active reservation.");
  }

  function openDialog({ eyebrow = "", title, body, actions }) {
    dialogEyebrow.textContent = eyebrow;
    dialogTitle.textContent = title;
    dialogBody.innerHTML = body;
    dialogActions.innerHTML = actions;
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
  }

  function openBookingDialog(machineId) {
    const raw = machineById(machineId);
    const machine = raw && effectiveMachine(raw);
    const status = machine ? normalizeStatus(machine.status) : "";
    if (!machine || status !== "available") {
      const busy = status === "in_use" || status === "starting";
      showToast("Not available", busy ? "This washer is in use. Booking reopens when the cycle ends." : "Choose a washer marked Available.", "error");
      return;
    }
    const step = 15 * 60 * 1000;
    const toInput = (ms) => {
      const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
      return d.toISOString().slice(0, 16);
    };
    const laterDefault = Math.ceil((Date.now() + 30 * 60 * 1000) / step) * step;
    openDialog({
      eyebrow: "New booking",
      title: machine.machine_name,
      body: `
        <div class="confirm-card">${icons.washer}<div><strong>${escapeHtml(machine.location)}</strong><span>Start right now or pick a time. You can start the washer up to 15 minutes early.</span></div></div>
        <div class="field"><span class="field-label">When</span>
          <div class="slot-grid">
            <div class="slot-option"><input id="when-now" type="radio" name="when" value="now" checked><label for="when-now">Start now</label></div>
            <div class="slot-option"><input id="when-later" type="radio" name="when" value="later"><label for="when-later">Pick a time</label></div>
          </div>
        </div>
        <div class="field is-hidden" id="laterField"><label for="bookingStart">Start time</label>
          <input id="bookingStart" type="datetime-local" step="900" min="${toInput(Date.now())}" max="${toInput(Date.now() + 48 * 3600 * 1000)}" value="${toInput(laterDefault)}">
        </div>
        <div class="field"><label for="bookingDuration">Duration</label>
          <select id="bookingDuration">
            <option value="30">30 minutes</option>
            <option value="60" selected>1 hour</option>
            <option value="90">1 hour 30 minutes</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        ${busyRangesHtml(machineId)}
        <p id="bookingSummary" class="booking-summary" aria-live="polite"></p>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Back</button><button class="primary-button" type="button" data-confirm-booking>Book ${escapeHtml(machine.machine_name)}</button>`,
    });

    const laterField = dialog.querySelector("#laterField");
    const startInput = dialog.querySelector("#bookingStart");
    const durationSelect = dialog.querySelector("#bookingDuration");
    const summary = dialog.querySelector("#bookingSummary");
    const when = () => dialog.querySelector("input[name=when]:checked").value;

    function readChoice() {
      const minutes = Number(durationSelect.value);
      let startMs;
      if (when() === "now") startMs = Math.floor(Date.now() / 1000) * 1000;
      else startMs = startInput.value ? new Date(startInput.value).getTime() : NaN;
      if (!Number.isFinite(startMs)) return { error: "Choose a start time." };
      if (when() === "later" && startMs < Date.now()) return { error: "That time has already passed." };
      if (startMs > Date.now() + 48 * 3600 * 1000) return { error: "Bookings are open for the next 48 hours." };
      const endMs = startMs + minutes * 60000;
      const clash = bookingConflict(machineId, startMs, endMs);
      if (clash) {
        const w = bookingWindow(clash);
        return { error: `This overlaps another booking (${formatTime(w.start)} – ${formatTime(w.end)}).` };
      }
      return { startMs, endMs, minutes };
    }

    function updateSummary() {
      laterField.classList.toggle("is-hidden", when() !== "later");
      const choice = readChoice();
      if (choice.error) {
        summary.dataset.state = "error";
        summary.textContent = choice.error;
        return choice;
      }
      summary.dataset.state = "ok";
      const canStartNow = choice.startMs - Date.now() <= EARLY_START_MS;
      summary.textContent = `${formatDate(new Date(choice.startMs).toISOString())} – ${formatTime(choice.endMs)}. ${canStartNow ? "You can start the washer right away." : `You can start the washer from ${formatTime(choice.startMs - EARLY_START_MS)}.`}`;
      return choice;
    }

    dialog.querySelectorAll("input[name=when]").forEach((input) => input.addEventListener("change", updateSummary));
    startInput.addEventListener("input", updateSummary);
    durationSelect.addEventListener("change", updateSummary);
    updateSummary();

    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-confirm-booking]").addEventListener("click", async () => {
      const choice = updateSummary();
      if (choice.error) {
        showToast("Check your booking", choice.error, "error");
        return;
      }
      await createBooking(machineId, new Date(choice.startMs).toISOString(), choice.minutes);
    });
  }

  async function createBooking(machineId, slotTime, durationMin = 120) {
    if (state.busy) return;
    state.busy = true;
    try {
      if (isLive) await loadData(); // re-check: nobody may book a washer that is in use or on hold
      const current = machineById(machineId) && effectiveMachine(machineById(machineId));
      if (!current || normalizeStatus(current.status) !== "available") {
        throw new Error("This washer is in use or on hold, so it cannot be booked right now.");
      }
      const booking = {
        booking_id: uuid(),
        user_id: state.user.id,
        machine_id: Number.isNaN(Number(machineId)) ? machineId : Number(machineId),
        slot_time: slotTime,
        ends_at: new Date(new Date(slotTime).getTime() + durationMin * 60 * 1000).toISOString(),
        status: "scheduled",
        created_at: new Date().toISOString(),
      };
      if (isLive) {
        await api("/rest/v1/bookings", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(booking),
        });
        await loadData();
      } else {
        state.bookings.push(booking);
        saveDemoData();
      }
      closeDialog();
      renderResident();
      const bookedText = `${machineById(machineId)?.machine_name || "Washer"} · ${formatDate(slotTime)}`;
      showToast("Booking confirmed", bookedText);
      pushNotice("Booking confirmed", bookedText);
      window.DormAlerts?.requestPermission();
      if (soundOn()) window.DormAlerts?.bookingConfirmed();
      window.DormAlerts?.notify("Booking confirmed", bookedText);
    } catch (error) {
      const overlap = /exclusion|overlap|duplicate key|unique/i.test(String(error.message));
      showToast("Booking failed", overlap ? "That time overlaps another booking for this washer. Choose a different time." : error.message, "error");
    } finally {
      state.busy = false;
    }
  }

  // R5: move an existing booking to another time (same washer)
  function openRescheduleDialog(bookingId) {
    const booking = state.bookings.find((item) => String(item.booking_id) === String(bookingId));
    if (!booking) return;
    const machine = machineById(booking.machine_id);
    const toInput = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const { start, end } = bookingWindow(booking);
    const currentMinutes = Math.round((end - start) / 60000);
    const options = [30, 60, 90, 120];
    if (!options.includes(currentMinutes)) options.push(currentMinutes);
    openDialog({
      eyebrow: "Reschedule booking",
      title: machine?.machine_name || "Washer",
      body: `
        <div class="confirm-card">${icons.booking}<div><strong>Now: ${escapeHtml(formatDate(booking.slot_time))} – ${escapeHtml(formatTime(end))}</strong><span>Choose a new start time. Your old slot is released only if the new one is free.</span></div></div>
        <div class="field"><label for="rescheduleStart">New start time</label>
          <input id="rescheduleStart" type="datetime-local" step="60" min="${toInput(Date.now())}" max="${toInput(Date.now() + 48 * 3600 * 1000)}" value="${toInput(Math.max(start, Date.now() + 15 * 60000))}">
        </div>
        <div class="field"><label for="rescheduleDuration">Duration</label>
          <select id="rescheduleDuration">${options.sort((a, b) => a - b).map((m) => `<option value="${m}" ${m === currentMinutes ? "selected" : ""}>${m} minutes</option>`).join("")}</select>
        </div>
        ${busyRangesHtml(booking.machine_id, bookingId)}
        <p id="rescheduleSummary" class="booking-summary" aria-live="polite"></p>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Back</button><button class="primary-button" type="button" data-confirm-reschedule>Move booking</button>`,
    });
    const input = dialog.querySelector("#rescheduleStart");
    const duration = dialog.querySelector("#rescheduleDuration");
    const summary = dialog.querySelector("#rescheduleSummary");
    function readChoice() {
      const startMs = input.value ? new Date(input.value).getTime() : NaN;
      if (!Number.isFinite(startMs)) return { error: "Choose a new start time." };
      if (startMs < Date.now() - 60000) return { error: "That time has already passed." };
      if (startMs > Date.now() + 48 * 3600 * 1000) return { error: "Bookings are open for the next 48 hours." };
      const minutes = Number(duration.value);
      const endMs = startMs + minutes * 60000;
      const clash = bookingConflict(booking.machine_id, startMs, endMs, bookingId);
      if (clash) {
        const w = clash.slot_time ? bookingWindow(clash) : { start: 0, end: 0 };
        return { error: `This overlaps another booking (${formatTime(w.start)} – ${formatTime(w.end)}).` };
      }
      return { startMs, endMs, minutes };
    }
    function update() {
      const choice = readChoice();
      summary.dataset.state = choice.error ? "error" : "ok";
      summary.textContent = choice.error || `New time: ${formatDate(new Date(choice.startMs).toISOString())} – ${formatTime(choice.endMs)}.`;
      return choice;
    }
    input.addEventListener("input", update);
    duration.addEventListener("change", update);
    update();
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-confirm-reschedule]").addEventListener("click", async () => {
      const choice = update();
      if (choice.error) {
        showToast("Check the new time", choice.error, "error");
        return;
      }
      if (state.busy) return;
      state.busy = true;
      try {
        const newStart = new Date(choice.startMs).toISOString();
        const newEnd = new Date(choice.endMs).toISOString();
        if (isLive) {
          await api("/rest/v1/rpc/reschedule_booking", {
            method: "POST",
            body: JSON.stringify({ p_booking_id: bookingId, p_new_start: newStart, p_minutes: choice.minutes }),
          });
          await loadData();
        } else {
          booking.slot_time = newStart;
          booking.ends_at = newEnd;
          saveDemoData();
        }
        closeDialog();
        renderResident();
        const text = `${machine?.machine_name || "Washer"} · ${formatDate(newStart)}`;
        showToast("Booking moved", text);
        pushNotice("Booking moved", text);
      } catch (error) {
        const overlap = /exclusion|overlap|duplicate key/i.test(String(error.message));
        showToast("Could not move the booking", overlap ? "That time overlaps another booking. Choose a different time." : error.message, "error");
      } finally {
        state.busy = false;
      }
    });
  }

  function openCancelDialog(bookingId) {
    const booking = state.bookings.find((item) => String(item.booking_id) === String(bookingId));
    if (!booking) return;
    const machine = machineById(booking.machine_id);
    openDialog({
      eyebrow: "Cancel booking",
      title: "Release this time slot?",
      body: `<div class="confirm-card">${icons.booking}<div><strong>${escapeHtml(machine?.machine_name || "Washer")}</strong><span>${escapeHtml(formatDate(booking.slot_time))}. The slot will become available to other residents.</span></div></div>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Keep booking</button><button class="danger-button" type="button" data-confirm-cancel>Cancel booking</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-confirm-cancel]").addEventListener("click", async () => {
      try {
        if (isLive) {
          const url = `/rest/v1/bookings?booking_id=eq.${encodeURIComponent(bookingId)}`;
          let kept = false;
          try {
            const rows = await api(url, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "cancelled" }) });
            kept = Array.isArray(rows) && rows.length > 0;
          } catch {
            kept = false;
          }
          if (!kept) await api(url, { method: "DELETE" }); // fallback when the policy does not allow the update
          await loadData();
        } else {
          state.bookings = state.bookings.filter((item) => String(item.booking_id) !== String(bookingId));
          saveDemoData();
        }
        closeDialog();
        renderResident();
        showToast("Booking cancelled", "The time slot is available again.");
        pushNotice("Booking cancelled", `${machine?.machine_name || "Washer"} · ${formatDate(booking.slot_time)}`);
      } catch (error) {
        showToast("Cancellation failed", error.message, "error");
      }
    });
  }

  // ---- Fault reports: history per washer, "My reports", admin replies -------
  function reportsFor(machineId) {
    return state.faults
      .filter((item) => String(item.machine_id) === String(machineId))
      .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
  }

  function myReports() {
    return state.faults
      .filter((item) => state.user && String(item.user_id) === String(state.user.id))
      .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
  }

  function myReportCount() {
    const open = myReports().filter((item) => normalizeStatus(item.status) !== "resolved").length;
    return open ? ` (${open} open)` : "";
  }

  function historyLink(machineId) {
    const list = reportsFor(machineId);
    const open = list.filter((item) => normalizeStatus(item.status) !== "resolved").length;
    const label = list.length ? `Problem history (${list.length}${open ? `, ${open} open` : ""})` : "Problem history";
    return `<button class="history-link" type="button" data-machine-reports="${escapeHtml(machineId)}">${label}</button>`;
  }

  function reportItem(report, { showMachine = false } = {}) {
    const status = normalizeStatus(report.status);
    const machineName = machineById(report.machine_id)?.machine_name || `Machine ${report.machine_id}`;
    const closed = status === "resolved" && report.resolved_at ? ` · closed ${formatDate(report.resolved_at)}` : "";
    const yours = state.user && String(report.user_id) === String(state.user.id);
    return `
      <article class="report-item">
        <div class="report-head">
          <span class="status-pill" data-status="${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] || status)}</span>
          <small>${showMachine ? `${escapeHtml(machineName)} · ` : ""}opened ${escapeHtml(formatDate(report.reported_at))}${escapeHtml(closed)}${yours && !showMachine ? " · your report" : ""}</small>
        </div>
        <p>${escapeHtml(report.description)}</p>
        ${report.admin_response ? `<div class="report-reply"><strong>Administrator${report.responded_at ? ` · ${escapeHtml(formatDate(report.responded_at))}` : ""}</strong><p>${escapeHtml(report.admin_response)}</p></div>` : ""}
      </article>`;
  }

  function openMachineReportsDialog(machineId) {
    const machine = machineById(machineId);
    const list = reportsFor(machineId);
    openDialog({
      eyebrow: "Problem history",
      title: machine?.machine_name || "Washer",
      body: list.length
        ? `<div class="report-list">${list.map((item) => reportItem(item)).join("")}</div>`
        : `<div class="confirm-card">${icons.success}<div><strong>No problems reported</strong><span>Nobody has reported a fault for this washer.</span></div></div>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Close</button><button class="primary-button" type="button" data-report-this>Report a fault</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-report-this]").addEventListener("click", () => openFaultDialog(machineId));
  }

  function openMyReportsDialog() {
    const list = myReports();
    openDialog({
      eyebrow: "My reports",
      title: "Your fault reports",
      body: list.length
        ? `<div class="report-list">${list.map((item) => reportItem(item, { showMachine: true })).join("")}</div>`
        : `<div class="confirm-card">${icons.empty}<div><strong>No reports yet</strong><span>Reports you send appear here with their status and the administrator's reply.</span></div></div>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Close</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
  }

  // Saves a fault change. If the new columns (reply, dates) are not in the database yet,
  // the status change still works and the user is told to run the SQL file.
  async function patchFault(reportId, fields) {
    if (isLive) {
      const url = `/rest/v1/fault_reports?report_id=eq.${encodeURIComponent(reportId)}`;
      const request = (body) => api(url, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) });
      try {
        await request(fields);
      } catch (error) {
        if (/column|schema cache/i.test(String(error.message)) && fields.status) {
          await request({ status: fields.status });
          showToast("Reply not saved", "Run supabase/fault_reports_update.sql in Supabase to enable replies and dates.", "error");
        } else {
          throw error;
        }
      }
      await loadData();
    } else {
      const fault = state.faults.find((item) => String(item.report_id) === String(reportId));
      if (fault) Object.assign(fault, fields);
      saveDemoData();
    }
  }

  function openReplyDialog(reportId) {
    const fault = state.faults.find((item) => String(item.report_id) === String(reportId));
    if (!fault) return;
    const machineName = machineById(fault.machine_id)?.machine_name || fault.machine_id;
    openDialog({
      eyebrow: "Fault report",
      title: `Reply · ${machineName}`,
      body: `
        <div class="confirm-card">${icons.fault}<div><strong>${escapeHtml(fault.description)}</strong><span>Opened ${escapeHtml(formatDate(fault.reported_at))}</span></div></div>
        <div class="field"><label for="replyText">Reply to the resident</label><textarea id="replyText" maxlength="500" placeholder="Example: A technician will check the drain on Friday.">${escapeHtml(fault.admin_response || "")}</textarea></div>
        <div class="field"><label for="replyStatus">Status</label><select id="replyStatus">${["open", "pending", "resolved"].map((status) => `<option value="${status}" ${normalizeStatus(fault.status) === status ? "selected" : ""}>${STATUS_LABELS[status]}</option>`).join("")}</select></div>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Back</button><button class="primary-button" type="button" data-save-reply>Save reply</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-save-reply]").addEventListener("click", async () => {
      const text = dialog.querySelector("#replyText").value.trim();
      const status = dialog.querySelector("#replyStatus").value;
      const now = new Date().toISOString();
      try {
        await patchFault(reportId, {
          admin_response: text || null,
          responded_at: text ? now : null,
          status,
          resolved_at: status === "resolved" ? fault.resolved_at || now : null,
        });
        closeDialog();
        renderAdmin();
        showToast("Reply saved", "The resident can see it under My reports.");
      } catch (error) {
        showToast("Save failed", error.message, "error");
      }
    });
  }

  function openFaultDialog(preselectId) {
    openDialog({
      eyebrow: "Fault report",
      title: "Tell us what happened",
      body: `
        <div class="field"><label for="faultMachine">Machine</label><select id="faultMachine">${state.machines.map((machine) => `<option value="${escapeHtml(machine.machine_id)}" ${String(machine.machine_id) === String(preselectId) ? "selected" : ""}>${escapeHtml(machine.machine_name)}</option>`).join("")}</select></div>
        <div class="field"><label for="faultDescription">Problem description</label><textarea id="faultDescription" maxlength="500" placeholder="Example: the machine does not drain after the cycle." required></textarea></div>`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Back</button><button class="primary-button" type="button" data-submit-fault>Send report</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    const reportId = uuid(); // one id per dialog: a repeated send can never create a second row
    const sendButton = dialog.querySelector("[data-submit-fault]");
    let sending = false;
    sendButton.addEventListener("click", async () => {
      if (sending) return; // ignore extra clicks while the report is being sent
      const machineId = dialog.querySelector("#faultMachine").value;
      const description = dialog.querySelector("#faultDescription").value.trim();
      if (description.length < 8) {
        showToast("Add more detail", "Describe the problem in at least 8 characters.", "error");
        return;
      }
      sending = true;
      sendButton.disabled = true;
      sendButton.textContent = "Sending...";
      const report = {
        report_id: reportId,
        machine_id: Number.isNaN(Number(machineId)) ? machineId : Number(machineId),
        user_id: state.user.id,
        description,
        status: "open",
        reported_at: new Date().toISOString(),
      };
      try {
        if (isLive) {
          await api("/rest/v1/fault_reports", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(report),
          });
          await loadData();
        } else {
          state.faults.unshift(report);
          saveDemoData();
        }
        closeDialog();
        renderResident();
        showToast("Report sent", "The administrator can now review this fault.");
      } catch (error) {
        showToast("Report failed", error.message, "error");
        sending = false;
        sendButton.disabled = false;
        sendButton.textContent = "Send report";
      }
    });
  }

  function renderAdmin() {
    const openFaults = state.faults.filter((item) => normalizeStatus(item.status) !== "resolved").length;
    const upcoming = activeBookings().length;
    const available = state.machines.filter((item) => normalizeStatus(item.status) === "available").length;
    const online = state.machines.filter(plugOnline).length;
    app.innerHTML = `
      <section class="page-head">
        <div class="page-title">
          <p class="eyebrow">Administrator workspace</p>
          <h1>Laundry administration</h1>
          <p>Monitor power, smart outlets, bookings and fault reports.</p>
        </div>
        ${userChip()}
      </section>

      <section class="stats-grid" aria-label="Laundry room summary">
        ${statCard(icons.machine, state.machines.length, "Total machines")}
        ${statCard(icons.success, available, "Available now")}
        ${statCard(icons.booking, upcoming, "Upcoming bookings")}
        ${statCard(icons.fault, openFaults, "Open faults")}
        ${statCard(icons.machine, `${online}/${state.machines.length}`, "Smart plugs online")}
      </section>

      <nav class="admin-tabs" aria-label="Administration sections">
        <button type="button" data-admin-tab="machines" class="${state.adminTab === "machines" ? "is-active" : ""}">Machines</button>
        <button type="button" data-admin-tab="bookings" class="${state.adminTab === "bookings" ? "is-active" : ""}">Bookings</button>
        <button type="button" data-admin-tab="faults" class="${state.adminTab === "faults" ? "is-active" : ""}">Fault reports</button>
        <button type="button" data-admin-tab="stats" class="${state.adminTab === "stats" ? "is-active" : ""}">Statistics</button>
      </nav>
      <section id="adminPanel" class="panel">${adminPanel()}</section>`;

    app.querySelectorAll("[data-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.adminTab = button.dataset.adminTab;
        renderAdmin();
      });
    });
    bindAdminActions();
  }

  function statCard(icon, value, label) {
    return `<article class="stat-card"><span class="stat-icon">${icon}</span><span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></span></article>`;
  }

  function adminPanel() {
    if (state.adminTab === "bookings") return bookingsTable();
    if (state.adminTab === "faults") return faultsTable();
    if (state.adminTab === "stats") return statsPanel();
    return machinesTable();
  }

  function machinesTable() {
    return `
      <div class="section-head"><div><h2>Machine and outlet status</h2><p>Live power comes from the smart plug; only administrators can mark a machine out of service</p></div><button class="primary-button" type="button" data-machine-edit="new">Add machine</button></div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Machine</th><th>Status</th><th>Power</th><th>Outlet</th><th>Device</th><th>Next booking</th><th></th></tr></thead><tbody>
        ${state.machines.map((machine) => {
          const next = nextBookingFor(machine.machine_id);
          const currentStatus = normalizeStatus(machine.status);
          return `<tr><td><strong>${escapeHtml(machine.machine_name)}</strong><small class="table-subtitle">${escapeHtml(machine.location)}</small></td><td><select class="inline-select" data-machine-status="${escapeHtml(machine.machine_id)}">${["available", "reserved", "starting", "in_use", "out_of_service", "offline"].map((status) => `<option value="${status}" ${currentStatus === status ? "selected" : ""}>${STATUS_LABELS[status]}</option>`).join("")}</select></td><td><strong>${escapeHtml(Number(machine.power_watts || 0).toFixed(1))} W</strong></td><td><span class="mini-state" data-on="${Boolean(machine.relay_state)}">${machine.relay_state ? "ON" : "OFF"}</span></td><td><span class="mini-state" data-online="${plugOnline(machine)}">${plugOnline(machine) ? "Online" : "Offline"}</span></td><td>${next ? escapeHtml(formatDate(next.slot_time)) : "-"}</td><td><button class="secondary-button" type="button" data-machine-edit="${escapeHtml(machine.machine_id)}">Edit</button></td></tr>`;
        }).join("")}
      </tbody></table></div>`;
  }

  // ---- Statistics panel (data analysis, Part C) ------------------------------
  // The same three questions are answered by supabase/analysis_queries.sql.
  const HOUR_FORMAT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Almaty" });

  function bookingStats() {
    const perHour = Array(24).fill(0);
    state.bookings.forEach((item) => {
      perHour[Number(HOUR_FORMAT.format(new Date(item.slot_time))) % 24] += 1;
    });
    const perMachine = state.machines.map((machine) => {
      const rows = state.bookings.filter((item) => String(item.machine_id) === String(machine.machine_id));
      const cancelled = rows.filter((item) => normalizeStatus(item.status) === "cancelled").length;
      return {
        name: machine.machine_name,
        total: rows.length,
        cancelled,
        pct: rows.length ? Math.round((1000 * cancelled) / rows.length) / 10 : 0,
      };
    });
    return { total: state.bookings.length, perHour, perMachine };
  }

  function hourLineChart(values) {
    const w = 640, h = 270, left = 52, right = 16, top = 16, bottom = 52;
    const peak = Math.max(...values);
    const top_y = Math.max(4, Math.ceil(peak / 4) * 4);
    const x = (i) => left + (i * (w - left - right)) / 23;
    const y = (v) => top + (1 - v / top_y) * (h - top - bottom);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const v = Math.round(top_y * f);
      return `<line x1="${left}" x2="${w - right}" y1="${y(v)}" y2="${y(v)}" stroke="#d5e0e9"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="#4a6176">${v}</text>`;
    }).join("");
    const ticks = values.map((_, i) => (i % 2 === 0 ? `<text x="${x(i)}" y="${h - bottom + 18}" text-anchor="middle" font-size="12" fill="#4a6176">${String(i).padStart(2, "0")}</text>` : "")).join("");
    const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const dots = values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#237bd1"><title>${String(i).padStart(2, "0")}:00 - ${v} bookings</title></circle>`).join("");
    const busiest = values.indexOf(peak);
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Line chart of bookings by hour of day. Busiest hour ${String(busiest).padStart(2, "0")}:00 with ${peak} bookings." class="chart-svg">
      ${grid}${ticks}
      <polyline points="${points}" fill="none" stroke="#237bd1" stroke-width="2.5" stroke-linejoin="round"/>${dots}
      <text x="${(left + w - right) / 2}" y="${h - 8}" text-anchor="middle" font-size="13" fill="#17314a">Hour of day (Astana time, 24 h)</text>
      <text transform="translate(14 ${(top + h - bottom) / 2}) rotate(-90)" text-anchor="middle" font-size="13" fill="#17314a">Bookings (count)</text>
    </svg>`;
  }

  function barRows(items, { max, unit }) {
    return `<div class="bar-chart" role="list">${items.map((item) => `
      <div class="bar-row" role="listitem">
        <span class="bar-label">${escapeHtml(item.name)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${max ? Math.max(2, (item.value / max) * 100) : 0}%"></span></span>
        <strong class="bar-value">${escapeHtml(item.value)}${unit}</strong>
      </div>`).join("")}</div>`;
  }

  function statsPanel() {
    const stats = bookingStats();
    if (!stats.total) {
      return `<div class="empty-state"><strong>No bookings yet</strong><span>Statistics appear when bookings exist.</span></div>`;
    }
    const peak = Math.max(...stats.perHour);
    const busiest = stats.perHour.indexOf(peak);
    const byMachine = stats.perMachine.map((m) => ({ name: m.name, value: m.total }));
    const byCancel = stats.perMachine.map((m) => ({ name: m.name, value: m.pct }));
    return `
      <div class="panel-head"><div><h2>Booking statistics</h2><p>${stats.total} bookings analysed. Busiest hour: ${String(busiest).padStart(2, "0")}:00 (${peak} bookings).</p></div></div>
      <div class="stats-charts">
        <section class="chart-card">
          <h3>Q1. At which hours are washers booked most?</h3>
          ${hourLineChart(stats.perHour)}
          <p class="chart-note">Data source: bookings table, slot start time, all statuses.</p>
        </section>
        <section class="chart-card">
          <h3>Q2. Which washer is booked most often?</h3>
          ${barRows(byMachine, { max: Math.max(...byMachine.map((i) => i.value)), unit: "" })}
          <p class="chart-axis">Bookings (count)</p>
          <p class="chart-note">Data source: bookings table, grouped by machine.</p>
        </section>
        <section class="chart-card">
          <h3>Q3. What share of bookings is cancelled, per washer?</h3>
          ${barRows(byCancel, { max: 100, unit: " %" })}
          <p class="chart-axis">Cancelled bookings (% of that washer's bookings)</p>
          <p class="chart-note">Data source: bookings table, status = cancelled.</p>
        </section>
      </div>`;
  }

  function bookingsTable() {
    const bookings = activeBookings();
    if (!bookings.length) return `<div class="empty-state">${icons.empty}<div>No upcoming bookings.</div></div>`;
    return `
      <div class="section-head"><div><h2>Upcoming bookings</h2><p>All active reservations in chronological order</p></div></div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Machine</th><th>Resident</th><th>Time</th><th>Status</th><th>Created</th></tr></thead><tbody>
        ${bookings.map((booking) => `<tr><td><strong>${escapeHtml(machineById(booking.machine_id)?.machine_name || booking.machine_id)}</strong></td><td>${escapeHtml(booking.user_id)}</td><td>${escapeHtml(formatDate(booking.slot_time))}</td><td><span class="status-pill" data-status="${escapeHtml(normalizeStatus(booking.status || "scheduled"))}">${escapeHtml(STATUS_LABELS[normalizeStatus(booking.status || "scheduled")] || booking.status)}</span></td><td>${escapeHtml(formatDate(booking.created_at || booking.slot_time))}</td></tr>`).join("")}
      </tbody></table></div>`;
  }

  function faultsTable() {
    if (!state.faults.length) return `<div class="empty-state">${icons.empty}<div>No fault reports.</div></div>`;
    return `
      <div class="section-head"><div><h2>Fault reports</h2><p>Review problems and update their progress</p></div></div>
      <div class="fault-list">
        ${state.faults.map((fault) => {
          const status = normalizeStatus(fault.status);
          const closed = status === "resolved" && fault.resolved_at ? ` · closed ${formatDate(fault.resolved_at)}` : "";
          return `<article class="fault-row"><span class="stat-icon">${icons.fault}</span><div><h3>${escapeHtml(machineById(fault.machine_id)?.machine_name || fault.machine_id)}</h3><p>${escapeHtml(fault.description)} · opened ${escapeHtml(formatDate(fault.reported_at))}${escapeHtml(closed)}</p>${fault.admin_response ? `<p class="fault-response"><strong>Reply:</strong> ${escapeHtml(fault.admin_response)}</p>` : ""}<button class="secondary-button fault-reply-button" type="button" data-fault-reply="${escapeHtml(fault.report_id)}">${fault.admin_response ? "Edit reply" : "Reply"}</button></div><select class="inline-select" data-fault-status="${escapeHtml(fault.report_id)}">${["open", "pending", "resolved"].map((option) => `<option value="${option}" ${status === option ? "selected" : ""}>${STATUS_LABELS[option]}</option>`).join("")}</select></article>`;
        }).join("")}
      </div>`;
  }

  function bindAdminActions() {
    app.querySelectorAll("[data-machine-status]").forEach((select) => {
      select.addEventListener("change", () => updateMachineStatus(select.dataset.machineStatus, select.value));
    });
    app.querySelectorAll("[data-machine-edit]").forEach((button) => {
      button.addEventListener("click", () => openMachineDialog(button.dataset.machineEdit));
    });
    app.querySelectorAll("[data-fault-status]").forEach((select) => {
      select.addEventListener("change", () => updateFaultStatus(select.dataset.faultStatus, select.value));
    });
    app.querySelectorAll("[data-fault-reply]").forEach((button) => {
      button.addEventListener("click", () => openReplyDialog(button.dataset.faultReply));
    });
  }

  // R8: administrator adds or edits a machine
  function openMachineDialog(machineId) {
    const isNew = machineId === "new";
    const machine = isNew ? null : machineById(machineId);
    if (!isNew && !machine) return;
    openDialog({
      eyebrow: isNew ? "New machine" : "Edit machine",
      title: isNew ? "Add a washing machine" : machine.machine_name,
      body: `
        <div class="field"><label for="machineName">Name</label><input id="machineName" type="text" maxlength="40" placeholder="Washer 4" value="${escapeHtml(machine?.machine_name || "")}"></div>
        <div class="field"><label for="machineLocation">Location</label><input id="machineLocation" type="text" maxlength="80" placeholder="Main Dormitory Laundry Room" value="${escapeHtml(machine?.location || "Main Dormitory Laundry Room")}"></div>
        ${isNew ? `<p class="booking-summary" data-state="ok">After saving you will get the smart plug ID and token for this machine (shown once).</p>` : `<button class="secondary-button" type="button" data-issue-plug>Smart plug: get ID and token</button>`}`,
      actions: `<button class="secondary-button" type="button" data-dialog-cancel>Back</button>${isNew ? "" : `<button class="danger-button" type="button" data-delete-machine>Delete machine</button>`}<button class="primary-button" type="button" data-save-machine>${isNew ? "Add machine" : "Save changes"}</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-delete-machine]")?.addEventListener("click", async () => {
      const text = `Delete ${machine.machine_name}? Its bookings, fault reports and smart plug will be deleted too. This cannot be undone.`;
      if (!window.confirm(text)) return;
      try {
        if (isLive) {
          await api("/rest/v1/rpc/admin_delete_machine", {
            method: "POST",
            body: JSON.stringify({ p_machine_id: Number(machineId) }),
          });
          await loadData();
        } else {
          if (state.bookings.some((b) => String(b.machine_id) === String(machineId) && normalizeStatus(b.status) === "active")) {
            throw new Error("This machine is in use now. Wait until the wash ends.");
          }
          state.machines = state.machines.filter((m) => String(m.machine_id) !== String(machineId));
          state.bookings = state.bookings.filter((b) => String(b.machine_id) !== String(machineId));
          state.faults = state.faults.filter((f) => String(f.machine_id) !== String(machineId));
          saveDemoData();
        }
        closeDialog();
        renderAdmin();
        showToast("Machine deleted", machine.machine_name);
      } catch (error) {
        showToast("Delete failed", error.message, "error");
      }
    });
    dialog.querySelector("[data-issue-plug]")?.addEventListener("click", () => {
      if (window.confirm("Issue a new token? The old token of this machine's plug will stop working.")) showPlugCredentials(machineId);
    });
    dialog.querySelector("[data-save-machine]").addEventListener("click", async () => {
      const name = dialog.querySelector("#machineName").value.trim();
      const location = dialog.querySelector("#machineLocation").value.trim();
      if (name.length < 2 || name.length > 40) return showToast("Check the form", "Machine name must be 2-40 characters.", "error");
      if (location.length < 2 || location.length > 80) return showToast("Check the form", "Location must be 2-80 characters.", "error");
      if (state.machines.some((m) => m.machine_name.toLowerCase() === name.toLowerCase() && String(m.machine_id) !== String(machineId))) {
        return showToast("Check the form", "A machine with this name already exists.", "error");
      }
      let savedId = null;
      try {
        if (isLive) {
          savedId = await api("/rest/v1/rpc/admin_save_machine", {
            method: "POST",
            body: JSON.stringify({ p_machine_id: isNew ? null : Number(machineId), p_name: name, p_location: location }),
          });
          await loadData();
        } else if (isNew) {
          const nextId = state.machines.reduce((max, m) => Math.max(max, Number(m.machine_id) || 0), 0) + 1;
          savedId = nextId;
          state.machines.push({ machine_id: nextId, machine_name: name, location, status: "available", power_watts: 0, relay_state: true, last_seen_at: new Date().toISOString() });
          saveDemoData();
        } else {
          machine.machine_name = name;
          machine.location = location;
          saveDemoData();
        }
        closeDialog();
        renderAdmin();
        showToast(isNew ? "Machine added" : "Machine updated", `${name} · ${location}`);
        if (isNew && savedId) showPlugCredentials(savedId);
      } catch (error) {
        showToast("Save failed", error.message, "error");
      }
    });
  }

  // Admin gets the plug ID + token ONCE (only the hash is stored) and a ready block for devices.json.
  async function showPlugCredentials(machineId) {
    try {
      let creds;
      if (isLive) {
        const rows = await api("/rest/v1/rpc/admin_issue_plug_token", { method: "POST", body: JSON.stringify({ p_machine_id: Number(machineId) }) });
        creds = rows?.[0];
        if (!creds) throw new Error("No credentials returned.");
      } else {
        const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
        creds = { device_id: uuid(), device_token: hex() + hex(), machine_name: machineById(machineId)?.machine_name || "Washer" };
      }
      const block = JSON.stringify({ name: creds.machine_name, id: creds.device_id, token: creds.device_token, always_running: false }, null, 2);
      openDialog({
        eyebrow: "Smart plug",
        title: `${creds.machine_name}: plug credentials`,
        body: `
          <div class="confirm-card">${icons.success}<div><strong>Shown only once</strong><span>The database keeps only a hash of the token. Copy the block into the "devices" list of devices.json (never into git), then restart fake_plug.py.</span></div></div>
          <div class="field"><label for="plugBlock">Add to devices.json</label><textarea id="plugBlock" rows="6" readonly style="width:100%;font-family:monospace">${escapeHtml(block)}</textarea></div>`,
        actions: `<button class="secondary-button" type="button" data-copy-plug>Copy</button><button class="primary-button" type="button" data-dialog-cancel>Done</button>`,
      });
      dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
      dialog.querySelector("[data-copy-plug]").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(block);
        } catch {
          dialog.querySelector("#plugBlock").select();
          document.execCommand("copy");
        }
        showToast("Copied", "Paste it into devices.json.");
      });
    } catch (error) {
      showToast("Could not issue plug credentials", error.message, "error");
    }
  }

  async function updateMachineStatus(machineId, status) {
    try {
      if (isLive) {
        await api(`/rest/v1/machines?machine_id=eq.${encodeURIComponent(machineId)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status }),
        });
        await loadData();
      } else {
        const machine = machineById(machineId);
        if (machine) machine.status = status;
        saveDemoData();
      }
      renderAdmin();
      showToast("Status updated", `${machineById(machineId)?.machine_name || "Machine"} is now ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (error) {
      showToast("Update failed", error.message, "error");
      await loadData();
      renderAdmin();
    }
  }

  async function updateFaultStatus(reportId, status) {
    try {
      const fault = state.faults.find((item) => String(item.report_id) === String(reportId));
      await patchFault(reportId, {
        status,
        resolved_at: status === "resolved" ? fault?.resolved_at || new Date().toISOString() : null,
      });
      renderAdmin();
      showToast("Fault updated", `The report is now ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (error) {
      showToast("Update failed", error.message, "error");
      await loadData();
      renderAdmin();
    }
  }

  function openHelp() {
    openDialog({
      eyebrow: isLive ? "Live database" : "Demonstration mode",
      title: "How to test DormLaundry",
      body: `
        <div class="confirm-card">${icons.success}<div><strong>${isLive ? "Connected to Supabase" : "All functions are active"}</strong><span>${isLive ? "Data is loaded from your project and protected by its RLS policies." : "Data is saved in this browser. Sign in as Resident to book and report faults, then as Administrator to manage them."}</span></div></div>
        <p style="line-height:1.6;color:var(--muted)"><strong>Resident:</strong> choose a washer, reserve a time, then press Start washer when the slot begins. The outlet is enabled only for that user.</p>
        <p style="line-height:1.6;color:var(--muted)"><strong>Smart plug:</strong> measured power changes the status to In use. The relay is never switched off while a running load is detected.</p>
        <p style="line-height:1.6;color:var(--muted)"><strong>Administrator:</strong> monitor power/outlet health, review bookings and process faults.</p>`,
      actions: `<button class="primary-button" type="button" data-dialog-cancel>Got it</button>`,
    });
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
  }

  async function restoreSession() {
    modeBadge.textContent = isLive ? "Supabase live" : "Demo mode";
    const saved = localStorage.getItem(STORAGE.session);
    if (!saved) {
      renderLogin();
      return;
    }
    try {
      const session = JSON.parse(saved);
      state.user = session.user;
      state.role = session.role === "admin" ? "admin" : "resident";
      state.token = isLive ? session.token : null;
      if (isLive && !state.token) throw new Error("Missing session");
      await loadData();
      renderApp();
    } catch {
      localStorage.removeItem(STORAGE.session);
      renderLogin();
    }
  }

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE.session);
    state.user = null;
    state.token = null;
    state.role = "resident";
    renderLogin();
    showToast("Signed out", "Your session has ended.");
  });

  helpButton.addEventListener("click", openHelp);
  dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
  dialogForm.addEventListener("submit", (event) => event.preventDefault());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  // ---- Sound toggle (opt-in: nothing plays until the user turns sound on) ----
  const SOUND_KEY = "dormlaundry.sound.v1";
  const soundButton = document.querySelector("#soundButton");

  function soundOn() {
    try {
      return localStorage.getItem(SOUND_KEY) === "on";
    } catch {
      return false;
    }
  }

  function renderSoundButton() {
    const on = soundOn();
    soundButton.setAttribute("aria-pressed", String(on));
    soundButton.setAttribute("aria-label", on ? "Turn off sound alerts" : "Turn on sound alerts");
    soundButton.title = on ? "Sound alerts: on" : "Sound alerts: off";
  }

  soundButton.addEventListener("click", () => {
    const next = !soundOn();
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* preference just will not persist */
    }
    renderSoundButton();
    if (next) {
      window.DormAlerts?.requestPermission();
      window.DormAlerts?.bookingConfirmed(); // short preview, started by the user's click
    }
    showToast(
      next ? "Sound alerts on" : "Sound alerts off",
      next ? "You will hear a signal when you book and when your time starts." : "No sounds will play. You will still see on-screen notifications.",
    );
  });
  renderSoundButton();

  // ---- Booking-time alert -------------------------------------------------
  // Checks every 10 s whether one of the signed-in user's bookings has just begun.
  const NOTIFIED_KEY = "dormlaundry.notified.bookings.v1";

  function getNotified() {
    try {
      return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function checkBookingTimes() {
    if (!state.user) return;
    const notified = getNotified();
    const now = Date.now();
    let fired = false;

    state.bookings.forEach((booking) => {
      if (String(booking.user_id) !== String(state.user.id)) return;
      if (normalizeStatus(booking.status || "scheduled") !== "scheduled") return;
      const start = new Date(booking.slot_time).getTime();
      const end = new Date(booking.ends_at || start + 2 * 60 * 60 * 1000).getTime();
      if (now < start || now >= end) return; // not started yet, or already over
      if (notified.has(String(booking.booking_id))) return;

      notified.add(String(booking.booking_id));
      fired = true;
      const machineName = machineById(booking.machine_id)?.machine_name || "Your washer";
      const text = `${machineName} is ready - your booking has started.`;
      showToast("Your time has come!", text);
      pushNotice("Your time has come", text);
      if (soundOn()) window.DormAlerts?.bookingTime();
      window.DormAlerts?.notify("DormLaundry: your time has come", text);
    });

    if (fired) {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified].slice(-200)));
      if (state.role !== "admin") renderResident();
    }
  }

  window.setInterval(checkBookingTimes, 10 * 1000);

  // ---- R6: notification centre (bell with unread counter) -----------------------
  const NOTICE_KEY = "dormlaundry.notices.v1";
  const bellButton = document.querySelector("#bellButton");
  const bellCount = document.querySelector("#bellCount");

  function readNotices() {
    try {
      return JSON.parse(localStorage.getItem(NOTICE_KEY) || "[]").filter((n) => !state.user || n.user === state.user.id);
    } catch {
      return [];
    }
  }

  function writeNotices(list) {
    try {
      const others = JSON.parse(localStorage.getItem(NOTICE_KEY) || "[]").filter((n) => state.user && n.user !== state.user.id);
      localStorage.setItem(NOTICE_KEY, JSON.stringify([...list, ...others].slice(0, 100)));
    } catch {
      /* notifications just will not persist */
    }
  }

  function renderBell() {
    if (!bellButton) return;
    bellButton.classList.toggle("is-hidden", !state.user);
    const unread = readNotices().filter((n) => !n.read).length;
    bellCount.textContent = unread > 9 ? "9+" : String(unread);
    bellCount.classList.toggle("is-hidden", unread === 0);
    bellButton.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
  }

  function pushNotice(title, text) {
    if (!state.user) return;
    const list = readNotices();
    list.unshift({ id: uuid(), user: state.user.id, title, text, at: new Date().toISOString(), read: false });
    writeNotices(list.slice(0, 30));
    renderBell();
  }

  function openNotices() {
    const list = readNotices();
    openDialog({
      eyebrow: "Notifications",
      title: "Your notifications",
      body: list.length
        ? `<ul class="notice-list">${list.map((n) => `<li data-read="${n.read}"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.text)}</span><small>${escapeHtml(formatDate(n.at))}</small></li>`).join("")}</ul>`
        : `<div class="empty-state">${icons.empty}<div>No notifications yet. You will see booking reminders and replies to your fault reports here.</div></div>`,
      actions: `<button class="secondary-button" type="button" data-clear-notices ${list.length ? "" : "disabled"}>Clear all</button><button class="primary-button" type="button" data-dialog-cancel>Close</button>`,
    });
    writeNotices(list.map((n) => ({ ...n, read: true })));
    renderBell();
    dialog.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    dialog.querySelector("[data-clear-notices]").addEventListener("click", () => {
      writeNotices([]);
      renderBell();
      closeDialog();
    });
  }

  bellButton?.addEventListener("click", openNotices);

  // Keep the screen live: re-read the data every 10 s (live mode) and redraw only when something changed.
  let lastSignature = "";
  let lastReportKeys = null;
  function notifyReportChanges() {
    if (state.role === "admin") return;
    const keys = new Map(myReports().map((f) => [String(f.report_id), `${normalizeStatus(f.status)}|${f.admin_response || ""}`]));
    if (lastReportKeys) {
      myReports().forEach((f) => {
        const before = lastReportKeys.get(String(f.report_id));
        if (before !== undefined && before !== keys.get(String(f.report_id))) {
          const name = machineById(f.machine_id)?.machine_name || "your washer";
          pushNotice("Fault report updated", `${name}: ${STATUS_LABELS[normalizeStatus(f.status)] || f.status}${f.admin_response ? " - the administrator replied." : "."}`);
          showToast("Your report was updated", `${name}: ${STATUS_LABELS[normalizeStatus(f.status)] || f.status}${f.admin_response ? " - the administrator replied." : "."}`);
          if (soundOn()) window.DormAlerts?.bookingConfirmed();
        }
      });
    }
    lastReportKeys = keys;
  }
  function viewSignature() {
    return JSON.stringify([
      state.machines.map((m) => {
        const e = effectiveMachine(m);
        return [m.machine_id, e.status, e.relay_state, Number(m.power_watts || 0), plugOnline(m)];
      }),
      state.bookings.map((b) => [b.booking_id, b.status, bookingOpen(b)]),
      state.faults.map((f) => [f.report_id, f.status, f.admin_response || ""]),
    ]);
  }
  window.setInterval(async () => {
    if (!state.user || state.busy || dialog.open) return;
    if (isLive) {
      try {
        await loadData();
      } catch {
        return;
      }
    }
    notifyReportChanges();
    const signature = viewSignature();
    if (lastSignature && signature !== lastSignature) renderApp();
    lastSignature = signature;
  }, 10 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkBookingTimes();
  });

  restoreSession().then(checkBookingTimes);
})();
