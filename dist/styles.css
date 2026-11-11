:root {
  --navy-950: #0b2238;
  --navy-900: #102f4b;
  --navy-800: #173d5d;
  --navy-700: #24516f;
  --ink: #17314a;
  --muted: #62788d;
  --line: #d5e0e9;
  --surface: #ffffff;
  --surface-soft: #f4f7fa;
  --blue: #237bd1;
  --blue-soft: #e7f1fc;
  --teal: #128886;
  --teal-soft: #e1f4f1;
  --green: #2f8138;
  --green-soft: #e8f5ea;
  --red: #d34c42;
  --red-soft: #fdecea;
  --amber: #b66b0d;
  --amber-soft: #fff2dc;
  --shadow: 0 18px 50px rgba(16, 47, 75, 0.12);
  --radius-lg: 28px;
  --radius-md: 18px;
  --radius-sm: 12px;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: var(--surface-soft);
  color: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 92% 4%, rgba(18, 136, 134, 0.13), transparent 25rem),
    linear-gradient(180deg, #eef5f7 0, #f6f8fa 26rem, #f4f7fa 100%);
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a,
select {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid rgba(35, 123, 209, 0.35);
  outline-offset: 2px;
}

.is-hidden {
  display: none !important;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px clamp(18px, 4vw, 56px);
  color: #fff;
  background: rgba(16, 47, 75, 0.97);
  border-bottom: 1px solid rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(14px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 18px;
  letter-spacing: 0.01em;
}

.brand small {
  margin-top: 3px;
  color: #bfd0df;
  font-size: 12px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--teal);
  border-radius: 50%;
}

.brand-mark svg {
  width: 34px;
  height: 34px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
}

.brand-mark .brand-mark-inner {
  stroke-width: 2.1;
  stroke-dasharray: 9 5.14;
  transform-box: fill-box;
  transform-origin: center;
  /* Short intro animation: ~4.8 s, then stops (WCAG 2.2.2). Disabled by prefers-reduced-motion. */
  animation: drum-spin 1.6s ease-in-out 3;
}

@keyframes drum-spin {
  to {
    transform: rotate(360deg);
  }
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 12px;
  color: #dff6f2;
  background: rgba(18, 136, 134, 0.27);
  border: 1px solid rgba(142, 225, 215, 0.32);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.icon-button,
.ghost-button,
.primary-button,
.secondary-button,
.danger-button,
.text-button {
  min-height: 44px;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.icon-button:active,
.ghost-button:active,
.primary-button:active,
.secondary-button:active,
.danger-button:active,
.text-button:active {
  transform: translateY(1px);
}

.icon-button {
  width: 44px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.icon-button svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ghost-button,
.primary-button,
.secondary-button,
.danger-button {
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
}

.ghost-button {
  color: #fff;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.33);
}

.ghost-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.primary-button {
  color: #fff;
  background: var(--blue);
  box-shadow: 0 9px 24px rgba(35, 123, 209, 0.2);
}

.primary-button:hover {
  background: #176ec0;
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.secondary-button {
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
}

.secondary-button:hover {
  background: var(--surface-soft);
}

.danger-button {
  color: #fff;
  background: var(--red);
}

.text-button {
  min-height: 38px;
  padding: 7px 2px;
  color: var(--blue);
  background: transparent;
  font-weight: 700;
}

.app-main {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 42px 0 70px;
}

.login-layout {
  min-height: calc(100vh - 188px);
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.78fr);
  align-items: stretch;
  gap: 24px;
}

.intro-panel,
.login-card,
.panel,
.machine-card,
.stat-card {
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(199, 214, 225, 0.95);
  box-shadow: var(--shadow);
}

.intro-panel {
  position: relative;
  min-height: 570px;
  overflow: hidden;
  padding: clamp(30px, 5vw, 62px);
  color: #fff;
  background:
    linear-gradient(135deg, rgba(16, 47, 75, 0.99), rgba(13, 57, 76, 0.98)),
    var(--navy-900);
  border-color: transparent;
  border-radius: var(--radius-lg);
}

.intro-panel::after {
  content: "";
  position: absolute;
  right: -105px;
  bottom: -125px;
  width: 360px;
  height: 360px;
  border: 62px solid rgba(18, 136, 134, 0.7);
  border-radius: 50%;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--teal);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.intro-panel .eyebrow {
  color: #7ed6ce;
}

.intro-panel h1,
.page-title h1,
.login-card h2,
.dialog h2 {
  margin: 0;
  color: inherit;
  line-height: 1.08;
}

.intro-panel h1 {
  position: relative;
  z-index: 1;
  max-width: 640px;
  font-size: clamp(42px, 6vw, 76px);
  font-weight: 500;
  letter-spacing: -0.045em;
}

.intro-copy {
  position: relative;
  z-index: 1;
  max-width: 620px;
  margin: 24px 0 36px;
  color: #cfdfeb;
  font-size: clamp(17px, 2vw, 21px);
  line-height: 1.55;
}

.feature-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 15px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #e7f1f7;
}

.feature-list svg {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  fill: none;
  stroke: #67c7be;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-card {
  align-self: center;
  padding: clamp(26px, 4vw, 42px);
  border-radius: var(--radius-lg);
}

.login-card h2 {
  font-size: 30px;
}

.login-card > p:not(.eyebrow) {
  margin: 12px 0 26px;
  color: var(--muted);
  line-height: 1.5;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 17px;
}

.field label,
.field-label {
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  color: var(--ink);
  background: #fff;
  border: 1px solid #bdcedb;
  border-radius: 12px;
}

.field textarea {
  min-height: 112px;
  resize: vertical;
  line-height: 1.5;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #8c9eae;
}

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  padding: 5px;
  background: #eaf0f4;
  border-radius: 14px;
}

.segmented button {
  min-height: 44px;
  padding: 8px 12px;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.segmented button.is-active {
  color: var(--ink);
  background: #fff;
  box-shadow: 0 4px 13px rgba(16, 47, 75, 0.1);
}

.login-submit {
  width: 100%;
  margin-top: 7px;
}

.login-note {
  display: flex;
  gap: 9px;
  margin: 18px 0 0;
  padding: 13px;
  color: #5f7181;
  background: #f2f6f8;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.45;
}

.login-note svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  fill: none;
  stroke: var(--teal);
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 27px;
}

.page-title h1 {
  font-size: clamp(34px, 5vw, 54px);
  font-weight: 500;
  letter-spacing: -0.035em;
}

.page-title p:not(.eyebrow) {
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 8px 8px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--teal);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
}

.user-chip strong,
.user-chip small {
  display: block;
}

.user-chip strong {
  max-width: 190px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chip small {
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 34px 0 17px;
}

.section-head h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.section-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 14px;
}

.machine-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.machine-card {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border-radius: var(--radius-md);
  box-shadow: 0 12px 35px rgba(16, 47, 75, 0.08);
}

.machine-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: var(--blue);
}

.machine-card[data-status="in_use"]::before {
  background: var(--amber);
}

.machine-card[data-status="reserved"]::before,
.machine-card[data-status="starting"]::before {
  background: var(--teal);
}

.machine-card[data-status="out_of_service"]::before,
.machine-card[data-status="offline"]::before {
  background: var(--red);
}

.machine-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.machine-visual {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  color: var(--navy-800);
  background: #edf3f7;
  border-radius: 18px;
}

.machine-visual svg {
  width: 40px;
  height: 40px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 6px 10px;
  color: var(--green);
  background: var(--green-soft);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill::before {
  content: "";
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
}

.status-pill[data-status="in_use"],
.status-pill[data-status="pending"],
.status-pill[data-status="starting"] {
  color: var(--amber);
  background: var(--amber-soft);
}

.status-pill[data-status="out_of_service"],
.status-pill[data-status="open"],
.status-pill[data-status="offline"] {
  color: var(--red);
  background: var(--red-soft);
}

.status-pill[data-status="resolved"],
.status-pill[data-status="confirmed"],
.status-pill[data-status="reserved"],
.status-pill[data-status="active"] {
  color: var(--teal);
  background: var(--teal-soft);
}

.status-pill[data-status="scheduled"] {
  color: var(--blue);
  background: var(--blue-soft);
}

.machine-card h3 {
  margin: 22px 0 6px;
  font-size: 22px;
  font-weight: 500;
}

.machine-location {
  min-height: 40px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.45;
}

.smart-meter {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.smart-meter > span {
  min-width: 0;
  padding: 10px 8px;
  background: var(--surface-soft);
  border: 1px solid #dfebf2;
  border-radius: 10px;
}

.smart-meter small,
.smart-meter strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.smart-meter small {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 10px;
}

.smart-meter strong {
  font-size: 12px;
}

.relay-state[data-on="true"],
.device-state[data-online="true"],
.mini-state[data-on="true"],
.mini-state[data-online="true"] {
  color: var(--green);
}

.relay-state[data-on="false"],
.device-state[data-online="false"],
.mini-state[data-on="false"],
.mini-state[data-online="false"] {
  color: var(--red);
}

.next-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 20px 0 17px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.next-slot span {
  color: var(--muted);
}

.machine-card .primary-button,
.machine-card .secondary-button {
  width: 100%;
}

.panel {
  padding: 22px;
  border-radius: var(--radius-md);
  box-shadow: 0 12px 35px rgba(16, 47, 75, 0.07);
}

.split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.72fr);
  gap: 20px;
  align-items: start;
}

.booking-list,
.fault-list {
  display: grid;
  gap: 12px;
}

.booking-row,
.fault-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 15px;
  background: var(--surface-soft);
  border: 1px solid #dfebf2;
  border-radius: 14px;
}

.booking-date {
  width: 62px;
  padding: 8px 5px;
  color: #fff;
  background: var(--navy-900);
  border-radius: 12px;
  text-align: center;
}

.booking-date strong,
.booking-date small {
  display: block;
}

.booking-date strong {
  font-size: 19px;
}

.booking-date small {
  color: #c7d8e5;
  font-size: 10px;
  text-transform: uppercase;
}

.booking-row h3,
.fault-row h3 {
  margin: 0 0 5px;
  font-size: 16px;
}

.booking-row p,
.fault-row p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.booking-status {
  display: inline-flex;
  margin-left: 7px;
  padding: 4px 7px;
  color: var(--teal);
  background: var(--teal-soft);
  border-radius: 999px;
  font-size: 10px;
  vertical-align: middle;
}

.booking-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.booking-actions button {
  padding-inline: 13px;
}

.quick-card {
  padding: 23px;
  color: #fff;
  background: var(--navy-900);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

.quick-card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.quick-card p {
  margin: 10px 0 20px;
  color: #cbdbe7;
  line-height: 1.55;
}

.quick-card .secondary-button {
  width: 100%;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.22);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 24px;
}

.table-subtitle {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-weight: 400;
}

.mini-state {
  display: inline-flex;
  padding: 5px 8px;
  background: var(--surface-soft);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 19px;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgba(16, 47, 75, 0.06);
}

.stat-icon {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  color: var(--teal);
  background: var(--teal-soft);
  border-radius: 13px;
}

.stat-icon svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.stat-card strong,
.stat-card small {
  display: block;
}

.stat-card strong {
  font-size: 28px;
  line-height: 1;
}

.stat-card small {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  overflow-x: auto;
  scrollbar-width: none;
}

.admin-tabs::-webkit-scrollbar {
  display: none;
}

.admin-tabs button {
  min-height: 44px;
  padding: 9px 15px;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
}

.admin-tabs button.is-active {
  color: var(--navy-900);
  background: #fff;
  border-color: var(--line);
  box-shadow: 0 7px 22px rgba(16, 47, 75, 0.08);
}

.data-table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 15px 13px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  color: #fff;
  background: var(--navy-900);
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.data-table th:first-child {
  border-radius: 12px 0 0 0;
}

.data-table th:last-child {
  border-radius: 0 12px 0 0;
}

.data-table tr:last-child td {
  border-bottom: 0;
}

.inline-select {
  min-height: 40px;
  padding: 8px 31px 8px 10px;
  color: var(--ink);
  background: #fff;
  border: 1px solid #bdcedb;
  border-radius: 10px;
}

.empty-state {
  padding: 34px 20px;
  color: var(--muted);
  background: #f7f9fb;
  border: 1px dashed #c6d4df;
  border-radius: 14px;
  text-align: center;
}

.empty-state svg {
  width: 38px;
  height: 38px;
  margin-bottom: 8px;
  fill: none;
  stroke: #89a0b3;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dialog {
  width: min(590px, calc(100% - 28px));
  max-height: calc(100vh - 28px);
  padding: 0;
  color: var(--ink);
  background: #fff;
  border: 0;
  border-radius: 22px;
  box-shadow: 0 35px 90px rgba(7, 29, 47, 0.3);
}

.dialog::backdrop {
  background: rgba(8, 27, 42, 0.67);
  backdrop-filter: blur(4px);
}

.dialog form {
  max-height: inherit;
  overflow-y: auto;
}

.dialog-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 24px 17px;
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.dialog h2 {
  font-size: 25px;
  font-weight: 500;
}

.dialog .icon-button {
  flex: 0 0 44px;
  color: var(--ink);
  border-color: var(--line);
}

.dialog-body {
  padding: 22px 24px 4px;
}

.dialog-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px 24px;
  background: #fff;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.slot-option {
  position: relative;
}

.slot-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.slot-option label {
  min-height: 48px;
  display: grid;
  place-items: center;
  padding: 8px;
  color: var(--ink);
  background: #fff;
  border: 1px solid #bdcedb;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 700;
}

.slot-option input:checked + label {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
}

.slot-option input:disabled + label {
  cursor: not-allowed;
  color: #9caab5;
  background: #eef2f5;
  text-decoration: line-through;
}

.confirm-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  margin-bottom: 18px;
  padding: 16px;
  background: var(--blue-soft);
  border-radius: 14px;
}

.confirm-card svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: var(--blue);
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.confirm-card strong,
.confirm-card span {
  display: block;
}

.confirm-card span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
}

.toast-region {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 70;
  display: grid;
  gap: 10px;
  pointer-events: none;
}

.toast {
  width: min(390px, calc(100vw - 40px));
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  padding: 15px 17px;
  color: #fff;
  background: var(--navy-900);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(6, 28, 45, 0.26);
  animation: toast-in 230ms ease both;
}

.toast[data-type="error"] {
  background: #8d2f29;
}

.toast svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: #7ed6ce;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toast[data-type="error"] svg {
  stroke: #ffd3d0;
}

.toast strong,
.toast span {
  display: block;
}

.toast span {
  margin-top: 3px;
  color: #d2e1eb;
  font-size: 12px;
  line-height: 1.4;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@media (max-width: 940px) {
  .login-layout,
  .split-layout {
    grid-template-columns: 1fr;
  }

  .intro-panel {
    min-height: 410px;
  }

  .machine-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .topbar {
    min-height: 68px;
    padding: 10px 14px;
  }

  .brand small,
  .mode-badge {
    display: none;
  }

  .topbar .ghost-button {
    min-height: 40px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 8px;
    font-size: 0;
  }

  .topbar .ghost-button::after {
    content: "Exit";
    font-size: 11px;
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .app-main {
    width: min(100% - 24px, 1180px);
    padding-top: 25px;
  }

  .login-layout {
    gap: 14px;
  }

  .intro-panel {
    min-height: 390px;
    padding: 30px 25px;
    border-radius: 22px;
  }

  .intro-panel h1 {
    font-size: 43px;
  }

  .login-card {
    padding: 25px 20px;
    border-radius: 22px;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .user-chip {
    width: 100%;
  }

  .machine-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .booking-row,
  .fault-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .booking-row > :last-child,
  .fault-row > :last-child {
    grid-column: 1 / -1;
  }

  .booking-row .secondary-button,
  .fault-row .secondary-button {
    width: 100%;
  }

  .booking-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .booking-actions button {
    width: 100%;
  }

  .slot-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dialog-head,
  .dialog-body,
  .dialog-actions {
    padding-left: 18px;
    padding-right: 18px;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .dialog-actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Booking-screen preview on the start screen (shown at 360 px width) */
.intro-figure {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 360px;
  margin: 28px 0 0;
}

.intro-figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: #fff;
}

.intro-figure figcaption {
  margin-top: 8px;
  color: #e7f1f7; /* on #102f4b navy: contrast > 12:1 */
  font-size: 0.875rem;
}

/* Sound toggle: state is shown by the icon shape, not only by colour */
#soundButton[aria-pressed="false"] .sound-waves,
#soundButton[aria-pressed="true"] .sound-off {
  display: none;
}

/* Machine hint and booking summary */
.machine-hint {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.booking-summary {
  margin: 12px 0 0;
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
}

.booking-summary[data-state="error"] {
  color: #b42318;
}

/* Fault history, My reports, admin reply */
.history-link {
  display: block;
  margin: 10px auto 0;
  padding: 6px 4px;
  border: 0;
  background: none;
  color: var(--blue);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.report-list {
  display: grid;
  gap: 12px;
  max-height: 55vh;
  overflow-y: auto;
}

.report-item {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
}

.report-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.report-head small {
  color: var(--muted);
}

.report-item p {
  margin: 8px 0 0;
  line-height: 1.5;
}

.report-reply {
  margin-top: 10px;
  padding: 10px 12px;
  border-left: 3px solid var(--teal);
  border-radius: 6px;
  background: var(--teal-soft);
}

.report-reply strong {
  font-size: 0.8125rem;
}

.fault-response {
  color: var(--ink);
}

.fault-reply-button {
  min-height: 36px;
  margin-top: 8px;
  padding: 6px 14px;
}

/* Statistics panel */
.stats-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.chart-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #fff;
}

.chart-card:first-child {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.chart-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 300px;
}

.bar-chart {
  display: grid;
  gap: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: 84px 1fr 56px;
  align-items: center;
  gap: 10px;
}

.bar-track {
  height: 18px;
  border-radius: 9px;
  background: var(--blue-soft);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 9px;
  background: var(--blue);
}

.bar-value {
  text-align: right;
}

.chart-axis {
  margin: 8px 0 0;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
}

.chart-note {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.8125rem;
}

/* Touch targets: at least 44 x 44 px (Stage 1 criterion 3) */
.brand {
  min-height: 44px;
}

.topbar .ghost-button {
  min-height: 44px;
}

.history-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
}

/* ---- Final features: bell, busy ranges, notice list ---- */
.bell-button { position: relative; }
.bell-count {
  position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px; background: #d64545; color: #fff; font-size: 11px; font-weight: 700;
  display: grid; place-items: center; line-height: 1;
}
.bell-count.is-hidden { display: none; }
.busy-ranges { margin: 12px 0 0; padding: 10px 14px; border: 1px solid var(--line, #d9e2ec); border-radius: 10px; background: rgba(18, 136, 134, 0.06); font-size: 14px; }
.busy-ranges ul { margin: 6px 0 0; padding-left: 18px; }
.busy-ranges li { margin: 2px 0; }
.notice-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; max-height: 50vh; overflow: auto; }
.notice-list li { display: grid; gap: 2px; padding: 10px 14px; border: 1px solid var(--line, #d9e2ec); border-radius: 10px; }
.notice-list li[data-read="false"] { border-color: #128886; background: rgba(18, 136, 134, 0.08); }
.notice-list small { color: var(--muted, #5b6b7a); }
.section-head .primary-button { white-space: nowrap; }

/* Layout fix: more room next to the fault list and the "Report a fault" card */
.split-layout {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.8fr);
  gap: 24px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-card p {
  margin: 0 0 8px;
}

.quick-card .secondary-button {
  min-height: 46px;
  white-space: normal;
}

.fault-row {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
}

.fault-row > .inline-select {
  grid-column: 2;
  justify-self: start;
  min-width: 150px;
}

.fault-row p {
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}

/* Phone fix: header buttons no longer overlap the logo; all admin tabs are visible */
@media (max-width: 650px) {
  .topbar {
    flex-wrap: wrap;
    gap: 10px 12px;
  }

  .brand {
    flex: 0 0 auto;
  }

  .topbar-actions {
    flex: 1 1 auto;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .admin-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: visible;
  }

  .admin-tabs button {
    width: 100%;
    border-color: var(--line);
    background: rgba(255, 255, 255, 0.6);
  }
}
