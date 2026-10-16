function pad(n) { return n.toString().padStart(2, "0"); }

// ---------- Shared tone generator ----------
// Every alarm and timer gets its own distinct default tone (so even without
// uploading a custom sound, the three alarms and three timers are each
// audibly different), generated with the Web Audio API so it's guaranteed
// to be audible.
let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => { /* ignore */ });
  }
  return sharedAudioCtx;
}

function playTone(frequency) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const duration = 0.35;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

// ---------- Shared per-item custom sound picker ----------
// Used by both alarm cards and timer cards: an "Upload Sound" button plus a
// "Use Default" reset, backed by a small array of {dataUrl, name} persisted
// to its own localStorage key (kept separate from the small JSON blobs that
// store times/labels, since audio data URLs can be large).
function setupSoundPicker({ cards, storageKey, defaultLabelPrefix, onChange }) {
  const sounds = Array.from(cards).map(() => null);

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(sounds)); } catch (e) {
      // Custom sounds are data URLs and can exceed localStorage's ~5MB quota;
      // the sound still plays for the current session even if it can't persist.
    }
  }

  function applyUI(card, index) {
    const nameEl = card.querySelector("[data-sound-name]");
    const resetBtn = card.querySelector(".sound-reset");
    if (sounds[index]) {
      nameEl.textContent = sounds[index].name;
      resetBtn.classList.remove("hidden");
    } else {
      nameEl.textContent = `${defaultLabelPrefix} ${index + 1}`;
      resetBtn.classList.add("hidden");
    }
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    cards.forEach((card, i) => {
      if (saved[i] && saved[i].dataUrl) sounds[i] = saved[i];
      applyUI(card, i);
    });
  } catch (e) { /* ignore corrupt storage */ }

  cards.forEach((card, i) => {
    const input = card.querySelector(".sound-input");
    card.querySelector('[data-action="upload-sound"]').addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      if (!file.type.startsWith("audio/")) {
        alert("Please choose an audio file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        sounds[i] = { dataUrl: reader.result, name: file.name };
        applyUI(card, i);
        save();
        if (onChange) onChange();
      };
      reader.readAsDataURL(file);
    });

    card.querySelector('[data-action="reset-sound"]').addEventListener("click", () => {
      sounds[i] = null;
      applyUI(card, i);
      save();
      if (onChange) onChange();
    });
  });

  return {
    play(index, fallbackFrequency) {
      const custom = sounds[index];
      if (custom && custom.dataUrl) {
        const audio = new Audio(custom.dataUrl);
        audio.play().catch(() => { /* autoplay may be blocked until user interacts */ });
      } else {
        playTone(fallbackFrequency);
      }
    }
  };
}

// ---------- Timers ----------
// Countdown is derived from a wall-clock end timestamp rather than counted
// down one setInterval tick at a time, so a throttled/backgrounded tab
// (where callbacks fire late or are coalesced) doesn't make the timer run
// slow — each tick just recomputes remaining time from Date.now().
const TIMER_TONES = [784, 698, 392]; // G5, F5, G4 — distinct from alarm tones
const timerCards = document.querySelectorAll(".timer-card");
const timerSoundPicker = setupSoundPicker({
  cards: timerCards,
  storageKey: "clockapp-timer-sounds",
  defaultLabelPrefix: "Default tone"
});

timerCards.forEach((card, cardIndex) => {
  const totalSeconds = parseInt(card.dataset.minutes, 10) * 60;
  let remaining = totalSeconds;
  let endTime = null; // Date.now()-based deadline while running
  let intervalId = null;
  const display = card.querySelector("[data-display]");

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
    display.classList.toggle("done", remaining <= 0);
  }

  function tick() {
    remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    if (remaining <= 0) {
      render();
      clearInterval(intervalId);
      intervalId = null;
      endTime = null;
      timerSoundPicker.play(cardIndex, TIMER_TONES[cardIndex]);
      return;
    }
    render();
  }

  card.querySelector('[data-action="start"]').addEventListener("click", () => {
    if (intervalId || remaining <= 0) return;
    endTime = Date.now() + remaining * 1000;
    intervalId = setInterval(tick, 1000);
  });
  card.querySelector('[data-action="pause"]').addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
    endTime = null;
  });
  card.querySelector('[data-action="reset"]').addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
    endTime = null;
    remaining = totalSeconds;
    render();
  });

  render();
});

// ---------- Alarms ----------
const alarmCards = document.querySelectorAll(".alarm-card");
const alarmOverlay = document.getElementById("alarm-overlay");
const alarmOverlayText = document.getElementById("alarm-overlay-text");
const alarmOverlayNote = document.getElementById("alarm-overlay-note");
const alarmDismissBtn = document.getElementById("alarm-dismiss");

const ALARM_TONES = [880, 659, 523]; // A5, E5, C5 — each alarm sounds different by default
const STORAGE_KEY = "clockapp-alarms";
let ringingInterval = null;

const alarmSoundPicker = setupSoundPicker({
  cards: alarmCards,
  storageKey: "clockapp-alarm-sounds",
  defaultLabelPrefix: "Default tone"
});

function loadAlarms() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    alarmCards.forEach((card, i) => {
      const a = saved[i];
      if (!a) return;
      card.querySelector(".alarm-time").value = a.time || "";
      card.querySelector(".alarm-enabled").checked = !!a.enabled;
      card.querySelector(".alarm-note").value = a.note || "";
      updateAlarmStatus(card);
    });
  } catch (e) { /* ignore corrupt storage */ }
}

function saveAlarms() {
  const data = Array.from(alarmCards).map((card) => ({
    time: card.querySelector(".alarm-time").value,
    enabled: card.querySelector(".alarm-enabled").checked,
    note: card.querySelector(".alarm-note").value
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // The in-memory alarm still works for this session; only persistence
    // across reloads is lost, so tell the user rather than fail silently.
    alarmCards.forEach((card) => {
      card.querySelector("[data-status]").textContent += " (not saved — storage unavailable)";
    });
  }
}

function updateAlarmStatus(card) {
  const enabled = card.querySelector(".alarm-enabled").checked;
  const time = card.querySelector(".alarm-time").value;
  const statusEl = card.querySelector("[data-status]");
  if (enabled && time) {
    statusEl.textContent = `Set for ${time}`;
    statusEl.classList.add("active");
  } else {
    statusEl.textContent = "Off";
    statusEl.classList.remove("active");
  }
}

alarmCards.forEach((card) => {
  card.querySelector(".alarm-time").addEventListener("change", () => {
    updateAlarmStatus(card);
    delete card.dataset.firedToday;
    saveAlarms();
    renderTodaysAlarms();
  });
  card.querySelector(".alarm-enabled").addEventListener("change", () => {
    updateAlarmStatus(card);
    delete card.dataset.firedToday;
    saveAlarms();
    renderTodaysAlarms();
  });
  card.querySelector(".alarm-note").addEventListener("change", () => {
    saveAlarms();
    renderTodaysAlarms();
  });
});

// Checks against elapsed wall-clock minutes rather than requiring the exact
// current minute to be observed, so a throttled/backgrounded tab that misses
// a tick (e.g. two polls land in the same minute, or a minute is skipped
// entirely) still fires the alarm instead of silently missing it.
let lastCheckedMinutes = Math.floor(Date.now() / 60000);

function checkAlarms() {
  const now = new Date();
  const todayKey = now.toDateString();
  const nowMinutes = Math.floor(now.getTime() / 60000);
  if (nowMinutes === lastCheckedMinutes) return;
  const sinceLastCheck = Math.min(nowMinutes - lastCheckedMinutes, 1440); // cap at a day
  lastCheckedMinutes = nowMinutes;

  alarmCards.forEach((card, i) => {
    const enabled = card.querySelector(".alarm-enabled").checked;
    const time = card.querySelector(".alarm-time").value;
    if (!enabled || !time) return;
    const [alarmHour, alarmMinute] = time.split(":").map(Number);
    const alarmDate = new Date(now);
    alarmDate.setHours(alarmHour, alarmMinute, 0, 0);
    const alarmMinutes = Math.floor(alarmDate.getTime() / 60000);
    const minutesSinceAlarm = nowMinutes - alarmMinutes;
    const alarmWasCrossed = minutesSinceAlarm >= 0 && minutesSinceAlarm < sinceLastCheck;
    if (alarmWasCrossed && card.dataset.firedToday !== todayKey) {
      card.dataset.firedToday = todayKey;
      triggerAlarm(i, time);
    }
  });
}
setInterval(checkAlarms, 1000);

function triggerAlarm(cardIndex, time) {
  const note = alarmCards[cardIndex].querySelector(".alarm-note").value.trim();
  alarmOverlayText.textContent = `Alarm ${cardIndex + 1} — ${time}`;
  alarmOverlayNote.textContent = note ? `“${note}”` : "";
  alarmOverlay.classList.remove("hidden");
  alarmSoundPicker.play(cardIndex, ALARM_TONES[cardIndex]);
  if (ringingInterval) clearInterval(ringingInterval);
  ringingInterval = setInterval(() => alarmSoundPicker.play(cardIndex, ALARM_TONES[cardIndex]), 1200);
}

alarmDismissBtn.addEventListener("click", () => {
  alarmOverlay.classList.add("hidden");
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
});

loadAlarms();

// ---------- Calendar ----------
function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("calendar-title");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  title.textContent = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  grid.innerHTML = "";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "calendar-weekday";
    cell.textContent = label;
    grid.appendChild(cell);
  });
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-day empty";
    grid.appendChild(blank);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    if (d === today) cell.classList.add("today");
    cell.textContent = d;
    grid.appendChild(cell);
  }
}

// Alarms here repeat daily, so "today's alarms" is simply every alarm
// that's currently enabled, along with the note explaining why it's set.
function renderTodaysAlarms() {
  const list = document.getElementById("todays-alarms-list");
  list.innerHTML = "";

  const active = Array.from(alarmCards).filter((card) =>
    card.querySelector(".alarm-enabled").checked && card.querySelector(".alarm-time").value
  );

  if (active.length === 0) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "No alarms set for today.";
    list.appendChild(empty);
    return;
  }

  active
    .slice()
    .sort((a, b) => a.querySelector(".alarm-time").value.localeCompare(b.querySelector(".alarm-time").value))
    .forEach((card) => {
      const time = card.querySelector(".alarm-time").value;
      const note = card.querySelector(".alarm-note").value.trim();
      const item = document.createElement("div");
      item.className = "todays-alarm-item";

      const timeEl = document.createElement("span");
      timeEl.className = "todays-alarm-time";
      timeEl.textContent = time;

      const noteEl = document.createElement("span");
      noteEl.className = "todays-alarm-note";
      noteEl.textContent = note || "No reason given";

      item.append(timeEl, noteEl);
      list.appendChild(item);
    });
}

renderCalendar();
renderTodaysAlarms();

// ---------- Background Image / Slideshow (see background.js) ----------
// Shows whatever background was set on the Settings page, consistent with
// the other pages. The upload controls themselves only live on Settings.
applyBackgroundFromStorage();
