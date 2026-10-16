// ---------- Clock ----------
function pad(n) { return n.toString().padStart(2, "0"); }

const CLOCK_MODE_KEY = "clockapp-clock-mode";
let clockMode = "digital";
try {
  clockMode = localStorage.getItem(CLOCK_MODE_KEY) || "digital";
} catch (e) { /* storage unavailable (e.g. blocked by browser privacy settings) */ }

const digitalClockEl = document.getElementById("clock");
const analogClockEl = document.getElementById("analog-clock");
const analogCtx = analogClockEl.getContext("2d");

function applyClockMode() {
  const isAnalog = clockMode === "analog";
  digitalClockEl.classList.toggle("hidden", isAnalog);
  analogClockEl.classList.toggle("hidden", !isAnalog);
  document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.clockMode === clockMode);
  });
}

document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clockMode = btn.dataset.clockMode;
    try { localStorage.setItem(CLOCK_MODE_KEY, clockMode); } catch (e) { /* storage unavailable */ }
    applyClockMode();
  });
});

function drawAnalogClock(now) {
  const size = analogClockEl.width;
  const radius = size / 2;
  const ctx = analogCtx;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(radius, radius);

  // Face
  ctx.beginPath();
  ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
  ctx.fillStyle = "#10152470";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4fd1c5";
  ctx.stroke();

  // Hour ticks
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.beginPath();
    const outer = radius - 14;
    const inner = radius - 24;
    ctx.moveTo(Math.sin(angle) * outer, -Math.cos(angle) * outer);
    ctx.lineTo(Math.sin(angle) * inner, -Math.cos(angle) * inner);
    ctx.strokeStyle = "#8d98b3";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = ((hours + minutes / 60) * Math.PI) / 6;
  const minuteAngle = ((minutes + seconds / 60) * Math.PI) / 30;
  const secondAngle = (seconds * Math.PI) / 30;

  drawHand(ctx, hourAngle, radius * 0.5, 6, "#e8ecf5");
  drawHand(ctx, minuteAngle, radius * 0.72, 4, "#e8ecf5");
  drawHand(ctx, secondAngle, radius * 0.8, 2, "#ff6b6b");

  // Center pin
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#4fd1c5";
  ctx.fill();

  ctx.restore();
}

function drawHand(ctx, angle, length, width, color) {
  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, -length);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function updateClock() {
  const now = new Date();
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  digitalClockEl.textContent = `${h}:${m}:${s}`;
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  drawAnalogClock(now);
}
setInterval(updateClock, 1000);
applyClockMode();
updateClock();

// ---------- Weather (Open-Meteo, no API key required) ----------
const weatherBtn = document.getElementById("weather-btn");
const weatherResult = document.getElementById("weather-result");
const weatherStatus = document.getElementById("weather-status");
const trafficResult = document.getElementById("traffic-result");
const trafficStatus = document.getElementById("traffic-status");

// Guards against a slower, earlier request overwriting a faster, later one
// (e.g. clicking Refresh twice in quick succession).
let weatherRequestId = 0;

const WEATHER_CODES = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm"
};

function requestWeather() {
  if (!navigator.geolocation) {
    weatherStatus.textContent = "Geolocation not supported by this browser.";
    return;
  }
  const requestId = ++weatherRequestId;
  weatherStatus.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => onLocationSuccess(pos, requestId),
    (err) => onLocationError(err, requestId),
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

weatherBtn.addEventListener("click", requestWeather);

async function onLocationSuccess(pos, requestId) {
  const { latitude, longitude } = pos.coords;
  if (requestId !== weatherRequestId) return; // a newer request has started
  weatherStatus.textContent = "Fetching weather…";
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res = await fetch(url);
    if (requestId !== weatherRequestId) return;
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    if (requestId !== weatherRequestId) return;
    renderWeather(data, latitude, longitude);
  } catch (err) {
    if (requestId !== weatherRequestId) return;
    weatherStatus.textContent = "Could not load weather. " + err.message;
  }
  renderTrafficPlaceholder(latitude, longitude);
}

function onLocationError(err, requestId) {
  if (requestId !== weatherRequestId) return;
  weatherStatus.textContent = "Location permission denied or unavailable.";
  trafficStatus.textContent = "Location permission denied — traffic unavailable.";
}

function renderWeather(data, lat, lon) {
  const c = data.current;
  const desc = WEATHER_CODES[c.weather_code] || "Unknown conditions";
  weatherStatus.textContent = "";
  weatherBtn.textContent = "Refresh";
  weatherResult.innerHTML = `
    <div class="weather-location">Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}</div>
    <div class="weather-main">
      <div class="weather-temp">${Math.round(c.temperature_2m)}°F</div>
      <div>
        <div>${desc}</div>
        <div class="weather-detail">Feels like ${Math.round(c.apparent_temperature)}°F</div>
      </div>
    </div>
    <div class="weather-detail">Humidity ${c.relative_humidity_2m}% · Wind ${Math.round(c.wind_speed_10m)} mph</div>
  `;
}

// Traffic: no key-free live traffic API exists, so we link out to a map
// centered on the user's coordinates rather than fake live data.
function renderTrafficPlaceholder(lat, lon) {
  trafficResult.innerHTML = `
    <div>Live traffic data requires a mapping API key (e.g. Google Maps, TomTom, HERE).</div>
    <a class="btn" style="text-decoration:none;display:inline-block;margin-top:8px"
       href="https://www.google.com/maps/@${lat},${lon},12z/data=!5m1!1e1" target="_blank" rel="noopener">
       Open Live Traffic Map
    </a>
  `;
}

// ---------- Timers ----------
// Countdown is derived from a wall-clock end timestamp rather than counted
// down one setInterval tick at a time, so a throttled/backgrounded tab
// (where callbacks fire late or are coalesced) doesn't make the timer run
// slow — each tick just recomputes remaining time from Date.now().
document.querySelectorAll(".timer-card").forEach((card) => {
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
      playBeep();
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
const alarmDismissBtn = document.getElementById("alarm-dismiss");

const STORAGE_KEY = "clockapp-alarms";
const ALARM_SOUNDS_STORAGE_KEY = "clockapp-alarm-sounds";
let ringingInterval = null;
let ringingAlarmIndex = null;
const alarmSounds = [null, null, null]; // data URLs, one per alarm card

function loadAlarms() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    alarmCards.forEach((card, i) => {
      const a = saved[i];
      if (!a) return;
      card.querySelector(".alarm-time").value = a.time || "";
      card.querySelector(".alarm-enabled").checked = !!a.enabled;
      updateAlarmStatus(card);
    });
  } catch (e) { /* ignore corrupt storage */ }

  try {
    const savedSounds = JSON.parse(localStorage.getItem(ALARM_SOUNDS_STORAGE_KEY) || "[]");
    alarmCards.forEach((card, i) => {
      if (savedSounds[i] && savedSounds[i].dataUrl) {
        alarmSounds[i] = savedSounds[i];
        updateAlarmSoundUI(card, savedSounds[i].name);
      }
    });
  } catch (e) { /* ignore corrupt storage */ }
}

function saveAlarmSounds() {
  try { localStorage.setItem(ALARM_SOUNDS_STORAGE_KEY, JSON.stringify(alarmSounds)); } catch (e) {
    // Custom sounds are data URLs and can exceed localStorage's ~5MB quota;
    // the sound still plays for the current session even if it can't persist.
  }
}

function updateAlarmSoundUI(card, fileName) {
  card.querySelector("[data-sound-name]").textContent = fileName;
  card.querySelector(".alarm-sound-reset").classList.remove("hidden");
}

function saveAlarms() {
  const data = Array.from(alarmCards).map((card) => ({
    time: card.querySelector(".alarm-time").value,
    enabled: card.querySelector(".alarm-enabled").checked
  }));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
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

alarmCards.forEach((card, i) => {
  card.querySelector(".alarm-time").addEventListener("change", () => {
    updateAlarmStatus(card);
    delete card.dataset.firedToday;
    saveAlarms();
  });
  card.querySelector(".alarm-enabled").addEventListener("change", () => {
    updateAlarmStatus(card);
    delete card.dataset.firedToday;
    saveAlarms();
  });

  const soundInput = card.querySelector(".alarm-sound-input");
  card.querySelector('[data-action="upload-sound"]').addEventListener("click", () => soundInput.click());

  soundInput.addEventListener("change", () => {
    const file = soundInput.files && soundInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please choose an audio file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      alarmSounds[i] = { dataUrl: reader.result, name: file.name };
      updateAlarmSoundUI(card, file.name);
      saveAlarmSounds();
    };
    reader.readAsDataURL(file);
    soundInput.value = "";
  });

  card.querySelector('[data-action="reset-sound"]').addEventListener("click", () => {
    alarmSounds[i] = null;
    card.querySelector("[data-sound-name]").textContent = "Default beep";
    card.querySelector(".alarm-sound-reset").classList.add("hidden");
    saveAlarmSounds();
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
  ringingAlarmIndex = cardIndex;
  alarmOverlayText.textContent = `Alarm ${cardIndex + 1} — ${time}`;
  alarmOverlay.classList.remove("hidden");
  playAlarmSound(cardIndex);
  if (ringingInterval) clearInterval(ringingInterval);
  ringingInterval = setInterval(() => playAlarmSound(cardIndex), 1200);
}

alarmDismissBtn.addEventListener("click", () => {
  alarmOverlay.classList.add("hidden");
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
  ringingAlarmIndex = null;
});

// The default alert sound is generated with the Web Audio API so it's
// guaranteed to be audible (a static embedded WAV with an empty data chunk
// was previously used and produced no sound at all).
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

function playBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const duration = 0.35;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playAlarmSound(cardIndex) {
  const custom = alarmSounds[cardIndex];
  if (custom && custom.dataUrl) {
    const audio = new Audio(custom.dataUrl);
    audio.play().catch(() => { /* autoplay may be blocked until user interacts */ });
  } else {
    playBeep();
  }
}

loadAlarms();

// ---------- Screensaver-friendly motion ----------
// Periodically nudge the center panel so the same pixels aren't static for
// hours on an OLED/plasma display, like a classic clock screensaver.
// ---------- Stock & Crypto Tracker ----------
const TRACKER_STORAGE_KEY = "clockapp-tracker";
const trackerSymbolInput = document.getElementById("tracker-symbol");
const trackerTypeSelect = document.getElementById("tracker-type");
const trackerAddBtn = document.getElementById("tracker-add-btn");
const trackerStatus = document.getElementById("tracker-status");
const trackerList = document.getElementById("tracker-list");
const trackerCount = document.getElementById("tracker-count");

function loadTrackedAssets() {
  try {
    const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "[]");
    // Enforce the cap here too, in case it was lowered after assets were
    // already saved by an earlier version of the app.
    return Array.isArray(saved) ? saved.slice(0, MAX_TRACKED_ASSETS) : [];
  } catch (e) {
    return [];
  }
}

function saveTrackedAssets(assets) {
  try { localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(assets)); } catch (e) { /* storage unavailable */ }
}

const MAX_TRACKED_ASSETS = 6;
let trackedAssets = loadTrackedAssets();

trackerAddBtn.addEventListener("click", () => {
  const rawSymbol = trackerSymbolInput.value.trim();
  const type = trackerTypeSelect.value;
  if (trackedAssets.length >= MAX_TRACKED_ASSETS) {
    trackerStatus.textContent = `You can track up to ${MAX_TRACKED_ASSETS} tickers. Remove one to add another.`;
    return;
  }
  if (!rawSymbol) {
    trackerStatus.textContent = "Enter a symbol first.";
    return;
  }
  const id = type === "crypto" ? rawSymbol.toLowerCase() : rawSymbol.toUpperCase();
  if (trackedAssets.some((a) => a.id === id && a.type === type)) {
    trackerStatus.textContent = "Already tracking that one.";
    return;
  }
  trackedAssets.push({ id, type });
  saveTrackedAssets(trackedAssets);
  trackerSymbolInput.value = "";
  trackerStatus.textContent = "";
  renderTrackerList();
});

trackerSymbolInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") trackerAddBtn.click();
});

function removeTrackedAsset(id, type) {
  trackedAssets = trackedAssets.filter((a) => !(a.id === id && a.type === type));
  saveTrackedAssets(trackedAssets);
  renderTrackerList();
}

function renderTrackerList() {
  const atLimit = trackedAssets.length >= MAX_TRACKED_ASSETS;
  trackerAddBtn.disabled = atLimit;
  trackerSymbolInput.disabled = atLimit;
  trackerCount.textContent = `${trackedAssets.length} / ${MAX_TRACKED_ASSETS} tickers`;

  trackerList.innerHTML = "";

  if (trackedAssets.length === 0) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = 'No assets tracked yet. Add a crypto id (e.g. "bitcoin", "ethereum") or a stock ticker (e.g. "AAPL").';
    trackerList.appendChild(empty);
    return;
  }

  // Built with DOM APIs (not innerHTML + template interpolation) because
  // asset.id comes straight from user input and must never be parsed as HTML.
  trackedAssets.forEach((a) => {
    const item = document.createElement("div");
    item.className = "tracker-item";
    item.dataset.id = a.id;
    item.dataset.type = a.type;

    const name = document.createElement("span");
    name.className = "tracker-item-name";
    name.append(`${a.id} `);
    const typeLabel = document.createElement("small");
    typeLabel.style.color = "var(--text-dim)";
    typeLabel.textContent = `(${a.type})`;
    name.appendChild(typeLabel);

    const price = document.createElement("span");
    price.className = "tracker-item-price";
    price.dataset.price = "";
    price.textContent = "Loading…";

    const removeBtn = document.createElement("button");
    removeBtn.className = "tracker-remove";
    removeBtn.dataset.remove = "";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => removeTrackedAsset(a.id, a.type));

    item.append(name, price, removeBtn);
    trackerList.appendChild(item);
  });

  refreshTrackerPrices();
}

async function fetchCryptoPrice(id) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  const entry = data[id];
  if (!entry) throw new Error("Unknown crypto id");
  return { price: entry.usd, changePct: entry.usd_24h_change };
}

async function fetchStockPrice(symbol) {
  // Stooq offers free, key-free delayed quotes via CSV.
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  const text = await res.text();
  const rows = text.trim().split("\n");
  if (rows.length < 2) throw new Error("No data");
  const cols = rows[1].split(",");
  // Columns: Symbol,Date,Time,Open,High,Low,Close,Volume
  const close = parseFloat(cols[6]);
  const open = parseFloat(cols[3]);
  if (isNaN(close)) throw new Error("Unknown ticker");
  const changePct = open ? ((close - open) / open) * 100 : 0;
  return { price: close, changePct };
}

let trackerRefreshInProgress = false;

async function refreshTrackerPrices() {
  // A slow upstream response (Stooq/CoinGecko hanging) could otherwise let
  // the next 60s interval start a second overlapping pass over the same
  // assets, multiplying outbound requests and worsening rate limiting.
  if (trackerRefreshInProgress) return;
  trackerRefreshInProgress = true;
  try {
    for (const asset of trackedAssets) {
      const el = trackerList.querySelector(`.tracker-item[data-id="${CSS.escape(asset.id)}"][data-type="${asset.type}"] [data-price]`);
      if (!el) continue;
      try {
        const { price, changePct } = asset.type === "crypto"
          ? await fetchCryptoPrice(asset.id)
          : await fetchStockPrice(asset.id);
        const dir = changePct >= 0 ? "up" : "down";
        const sign = changePct >= 0 ? "+" : "";
        el.textContent = "";
        el.append(`$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} `);
        const change = document.createElement("span");
        change.className = `tracker-item-change ${dir}`;
        change.textContent = `${sign}${changePct.toFixed(2)}%`;
        el.appendChild(change);
      } catch (err) {
        el.textContent = "Unavailable";
      }
    }
  } finally {
    trackerRefreshInProgress = false;
  }
}

renderTrackerList();
setInterval(refreshTrackerPrices, 60000);

(function screensaverDrift() {
  const main = document.querySelector("main.center");
  let x = 0, y = 0, dx = 1, dy = 1;
  const maxShift = 6;
  setInterval(() => {
    x += dx;
    y += dy;
    if (Math.abs(x) >= maxShift) dx *= -1;
    if (Math.abs(y) >= maxShift) dy *= -1;
    main.style.transform = `translate(${x}px, ${y}px)`;
  }, 4000);
})();

// ---------- Screensaver Mode ----------
// Hides the ad slots and the tracker/timer/alarm panels so only the clock
// and weather stay on screen, and hides the cursor after a few seconds of
// inactivity. Any key press, click, or mouse move exits.
const screensaverBtn = document.getElementById("screensaver-btn");
let screensaverActive = false;
let cursorIdleTimeout = null;

function enterScreensaverMode(manual) {
  if (screensaverActive) return;
  screensaverActive = true;
  document.body.classList.add("screensaver-mode");
  // Browsers only grant fullscreen in direct response to a user gesture, so
  // only request it when the button triggered entry — requesting it from
  // the automatic idle timer would just be silently rejected.
  if (manual && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => { /* fullscreen may be blocked */ });
  }
  resetCursorIdleTimer();
  document.addEventListener("mousemove", onScreensaverActivity);
  document.addEventListener("keydown", onScreensaverActivity);
  document.addEventListener("click", onScreensaverActivity);
}

function exitScreensaverMode() {
  if (!screensaverActive) return;
  screensaverActive = false;
  document.body.classList.remove("screensaver-mode", "cursor-hidden");
  clearTimeout(cursorIdleTimeout);
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => { /* ignore */ });
  }
  document.removeEventListener("mousemove", onScreensaverActivity);
  document.removeEventListener("keydown", onScreensaverActivity);
  document.removeEventListener("click", onScreensaverActivity);
  resetAutoScreensaverTimer();
}

function resetCursorIdleTimer() {
  document.body.classList.remove("cursor-hidden");
  clearTimeout(cursorIdleTimeout);
  cursorIdleTimeout = setTimeout(() => {
    document.body.classList.add("cursor-hidden");
  }, 3000);
}

function onScreensaverActivity() {
  // The button click that enters screensaver mode calls stopPropagation
  // below, so it never reaches these document-level listeners (which are
  // only attached once already inside screensaver mode) — any event here is
  // a genuine exit signal, including mouse movement.
  exitScreensaverMode();
}

screensaverBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  enterScreensaverMode(true);
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && screensaverActive) {
    exitScreensaverMode();
  }
});

// Automatically enter screensaver mode after 10 minutes of no mouse,
// keyboard, click, or touch activity anywhere on the page.
const AUTO_SCREENSAVER_IDLE_MS = 10 * 60 * 1000;
let autoScreensaverTimeout = null;

function resetAutoScreensaverTimer() {
  clearTimeout(autoScreensaverTimeout);
  if (screensaverActive) return;
  autoScreensaverTimeout = setTimeout(() => {
    if (!screensaverActive) enterScreensaverMode(false);
  }, AUTO_SCREENSAVER_IDLE_MS);
}

["mousemove", "keydown", "click", "touchstart", "wheel"].forEach((evt) => {
  document.addEventListener(evt, resetAutoScreensaverTimer, { passive: true });
});
resetAutoScreensaverTimer();

// ---------- Background Image Upload ----------
const BG_IMAGE_STORAGE_KEY = "clockapp-bg-image";
const bgUploadBtn = document.getElementById("bg-upload-btn");
const bgUploadInput = document.getElementById("bg-upload-input");
const bgClearBtn = document.getElementById("bg-clear-btn");

function applyBackgroundImage(dataUrl) {
  if (dataUrl) {
    document.body.style.backgroundImage = `url("${dataUrl}")`;
    document.body.classList.add("has-bg-image");
    bgClearBtn.classList.remove("hidden");
  } else {
    document.body.style.backgroundImage = "";
    document.body.classList.remove("has-bg-image");
    bgClearBtn.classList.add("hidden");
  }
}

bgUploadBtn.addEventListener("click", () => bgUploadInput.click());

let bgUploadRequestId = 0;

bgUploadInput.addEventListener("change", () => {
  const file = bgUploadInput.files && bgUploadInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }
  const requestId = ++bgUploadRequestId;
  const reader = new FileReader();
  reader.onload = () => {
    if (requestId !== bgUploadRequestId) return; // a newer upload has started
    const dataUrl = reader.result;
    applyBackgroundImage(dataUrl);
    try { localStorage.setItem(BG_IMAGE_STORAGE_KEY, dataUrl); } catch (e) {
      // localStorage has a size limit (~5MB); a large photo may not persist
      // across reloads, but it still applies for the current session.
    }
  };
  reader.readAsDataURL(file);
  bgUploadInput.value = "";
});

bgClearBtn.addEventListener("click", () => {
  applyBackgroundImage(null);
  try { localStorage.removeItem(BG_IMAGE_STORAGE_KEY); } catch (e) { /* storage unavailable */ }
});

(function restoreBackgroundImage() {
  try {
    const saved = localStorage.getItem(BG_IMAGE_STORAGE_KEY);
    if (saved) applyBackgroundImage(saved);
  } catch (e) { /* storage unavailable */ }
})();

