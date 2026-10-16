// ---------- Clock ----------
function pad(n) { return n.toString().padStart(2, "0"); }

const CLOCK_MODE_KEY = "clockapp-clock-mode";
let clockMode = localStorage.getItem(CLOCK_MODE_KEY) || "digital";

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
const weatherBody = document.getElementById("weather-body");
const weatherStatus = document.getElementById("weather-status");
const trafficBody = document.getElementById("traffic-body");
const trafficStatus = document.getElementById("traffic-status");

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

weatherBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    weatherStatus.textContent = "Geolocation not supported by this browser.";
    return;
  }
  weatherStatus.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
    enableHighAccuracy: false,
    timeout: 10000
  });
});

async function onLocationSuccess(pos) {
  const { latitude, longitude } = pos.coords;
  weatherStatus.textContent = "Fetching weather…";
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    renderWeather(data, latitude, longitude);
  } catch (err) {
    weatherStatus.textContent = "Could not load weather. " + err.message;
  }
  renderTrafficPlaceholder(latitude, longitude);
}

function onLocationError(err) {
  weatherStatus.textContent = "Location permission denied or unavailable.";
  trafficStatus.textContent = "Location permission denied — traffic unavailable.";
}

function renderWeather(data, lat, lon) {
  const c = data.current;
  const desc = WEATHER_CODES[c.weather_code] || "Unknown conditions";
  weatherBody.innerHTML = `
    <div class="weather-location">Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}</div>
    <div class="weather-main">
      <div class="weather-temp">${Math.round(c.temperature_2m)}°F</div>
      <div>
        <div>${desc}</div>
        <div class="weather-detail">Feels like ${Math.round(c.apparent_temperature)}°F</div>
      </div>
    </div>
    <div class="weather-detail">Humidity ${c.relative_humidity_2m}% · Wind ${Math.round(c.wind_speed_10m)} mph</div>
    <button id="weather-btn" class="btn">Refresh</button>
  `;
  document.getElementById("weather-btn").addEventListener("click", () => {
    weatherStatus.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
  });
}

// Traffic: no key-free live traffic API exists, so we link out to a map
// centered on the user's coordinates rather than fake live data.
function renderTrafficPlaceholder(lat, lon) {
  trafficBody.innerHTML = `
    <div>Live traffic data requires a mapping API key (e.g. Google Maps, TomTom, HERE).</div>
    <a class="btn" style="text-decoration:none;display:inline-block;margin-top:8px"
       href="https://www.google.com/maps/@${lat},${lon},12z/data=!5m1!1e1" target="_blank" rel="noopener">
       Open Live Traffic Map
    </a>
  `;
}

// ---------- Timers ----------
document.querySelectorAll(".timer-card").forEach((card) => {
  const totalSeconds = parseInt(card.dataset.minutes, 10) * 60;
  let remaining = totalSeconds;
  let intervalId = null;
  const display = card.querySelector("[data-display]");

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
    display.classList.toggle("done", remaining <= 0);
  }

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      render();
      clearInterval(intervalId);
      intervalId = null;
      playBeep();
      return;
    }
    render();
  }

  card.querySelector('[data-action="start"]').addEventListener("click", () => {
    if (intervalId || remaining <= 0) return;
    intervalId = setInterval(tick, 1000);
  });
  card.querySelector('[data-action="pause"]').addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
  });
  card.querySelector('[data-action="reset"]').addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
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
let ringingInterval = null;

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

alarmCards.forEach((card) => {
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
});

function checkAlarms() {
  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const current = `${hh}:${mm}`;
  const todayKey = now.toDateString();

  alarmCards.forEach((card, i) => {
    const enabled = card.querySelector(".alarm-enabled").checked;
    const time = card.querySelector(".alarm-time").value;
    if (!enabled || !time) return;
    if (time === current && card.dataset.firedToday !== todayKey) {
      card.dataset.firedToday = todayKey;
      triggerAlarm(i + 1, time);
    }
  });
}
setInterval(checkAlarms, 1000);

function triggerAlarm(index, time) {
  alarmOverlayText.textContent = `Alarm ${index} — ${time}`;
  alarmOverlay.classList.remove("hidden");
  playBeep();
  ringingInterval = setInterval(playBeep, 1200);
}

alarmDismissBtn.addEventListener("click", () => {
  alarmOverlay.classList.add("hidden");
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
});

function playBeep() {
  const audio = document.getElementById("beep-sound");
  audio.currentTime = 0;
  audio.play().catch(() => { /* autoplay may be blocked until user interacts */ });
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
    return JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveTrackedAssets(assets) {
  try { localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(assets)); } catch (e) { /* storage unavailable */ }
}

let trackedAssets = loadTrackedAssets();

const MAX_TRACKED_ASSETS = 6;

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

  if (trackedAssets.length === 0) {
    trackerList.innerHTML = `<div class="status">No assets tracked yet. Add a crypto id (e.g. "bitcoin", "ethereum") or a stock ticker (e.g. "AAPL").</div>`;
    return;
  }
  trackerList.innerHTML = trackedAssets.map((a) => `
    <div class="tracker-item" data-id="${a.id}" data-type="${a.type}">
      <span class="tracker-item-name">${a.id} <small style="color:var(--text-dim)">(${a.type})</small></span>
      <span class="tracker-item-price" data-price>Loading…</span>
      <button class="tracker-remove" data-remove>✕</button>
    </div>
  `).join("");

  trackerList.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const item = e.target.closest(".tracker-item");
      removeTrackedAsset(item.dataset.id, item.dataset.type);
    });
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

async function refreshTrackerPrices() {
  for (const asset of trackedAssets) {
    const el = trackerList.querySelector(`.tracker-item[data-id="${CSS.escape(asset.id)}"][data-type="${asset.type}"] [data-price]`);
    if (!el) continue;
    try {
      const { price, changePct } = asset.type === "crypto"
        ? await fetchCryptoPrice(asset.id)
        : await fetchStockPrice(asset.id);
      const dir = changePct >= 0 ? "up" : "down";
      const sign = changePct >= 0 ? "+" : "";
      el.innerHTML = `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span class="tracker-item-change ${dir}">${sign}${changePct.toFixed(2)}%</span>`;
    } catch (err) {
      el.textContent = "Unavailable";
    }
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
