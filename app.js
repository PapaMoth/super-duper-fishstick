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

// The digital/analog choice itself is set on the Settings page; this page
// just reads the stored preference and renders accordingly.
function applyClockMode() {
  const isAnalog = clockMode === "analog";
  digitalClockEl.classList.toggle("hidden", isAnalog);
  analogClockEl.classList.toggle("hidden", !isAnalog);
}

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

// A plain `fetch` has no deadline of its own: a stalled upstream connection
// (accepted but never completed) would otherwise leave a panel stuck on its
// loading state forever. This aborts and rejects after `timeoutMs`.
async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Weather & Traffic (Open-Meteo, no API key required) ----------
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
    const res = await fetchWithTimeout(url);
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
  trafficStatus.textContent = "";
  trafficResult.innerHTML = `
    <div>Live traffic data requires a mapping API key (e.g. Google Maps, TomTom, HERE).</div>
    <a class="btn" style="text-decoration:none;display:inline-block;margin-top:8px"
       href="https://www.google.com/maps/@${lat},${lon},12z/data=!5m1!1e1" target="_blank" rel="noopener">
       Open Live Traffic Map
    </a>
  `;
}

// ---------- Stock & Crypto Tracker ----------
const TRACKER_STORAGE_KEY = "clockapp-tracker";
const trackerSymbolInput = document.getElementById("tracker-symbol");
const trackerTypeSelect = document.getElementById("tracker-type");
const trackerAddBtn = document.getElementById("tracker-add-btn");
const trackerStatus = document.getElementById("tracker-status");
const trackerList = document.getElementById("tracker-list");
const trackerCount = document.getElementById("tracker-count");

const MAX_TRACKED_ASSETS = 6;

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
  try {
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    // The in-memory list still works for this session; only persistence
    // across reloads is lost, so tell the user rather than fail silently.
    trackerStatus.textContent = "Note: your tracker list could not be saved (storage unavailable).";
  }
}

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
  trackerPriceCache.delete(trackerCacheKey({ id, type }));
  saveTrackedAssets(trackedAssets);
  renderTrackerList();
}

// Caches each asset's last fetched price so that adding or removing one
// ticker doesn't force every other already-displayed ticker to refetch too
// (previously, adding 6 tickers one at a time triggered 1+2+...+6 = 21
// requests instead of 6, which could trip free-tier API rate limits).
const trackerPriceCache = new Map();
const trackerCacheKey = (a) => `${a.type}:${a.id}`;

function renderTrackerPriceCell(el, price, changePct) {
  const dir = changePct >= 0 ? "up" : "down";
  const sign = changePct >= 0 ? "+" : "";
  el.textContent = "";
  el.append(`$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} `);
  const change = document.createElement("span");
  change.className = `tracker-item-change ${dir}`;
  change.textContent = `${sign}${changePct.toFixed(2)}%`;
  el.appendChild(change);
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
    const cached = trackerPriceCache.get(trackerCacheKey(a));
    if (cached) {
      renderTrackerPriceCell(price, cached.price, cached.changePct);
    } else {
      price.textContent = "Loading…";
    }

    const removeBtn = document.createElement("button");
    removeBtn.className = "tracker-remove";
    removeBtn.dataset.remove = "";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => removeTrackedAsset(a.id, a.type));

    item.append(name, price, removeBtn);
    trackerList.appendChild(item);
  });

  refreshTrackerPrices(false);
}

async function fetchCryptoPrice(id) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  const entry = data[id];
  if (!entry) throw new Error("Unknown crypto id");
  return { price: entry.usd, changePct: entry.usd_24h_change };
}

async function fetchStockPrice(symbol) {
  // Stooq offers free, key-free delayed quotes via CSV.
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetchWithTimeout(url);
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

async function refreshTrackerPrices(force) {
  // A slow upstream response (Stooq/CoinGecko hanging) could otherwise let
  // the next 60s interval start a second overlapping pass over the same
  // assets, multiplying outbound requests and worsening rate limiting.
  if (trackerRefreshInProgress) return;
  trackerRefreshInProgress = true;
  try {
    for (const asset of trackedAssets) {
      const key = trackerCacheKey(asset);
      if (!force && trackerPriceCache.has(key)) continue; // already shown from cache
      const el = trackerList.querySelector(`.tracker-item[data-id="${CSS.escape(asset.id)}"][data-type="${asset.type}"] [data-price]`);
      if (!el) continue;
      try {
        const { price, changePct } = asset.type === "crypto"
          ? await fetchCryptoPrice(asset.id)
          : await fetchStockPrice(asset.id);
        trackerPriceCache.set(key, { price, changePct });
        renderTrackerPriceCell(el, price, changePct);
      } catch (err) {
        el.textContent = "Unavailable";
      }
    }
  } finally {
    trackerRefreshInProgress = false;
  }
}

renderTrackerList();
setInterval(() => refreshTrackerPrices(true), 60000);

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
// Hides the ad slots and the tracker panel so only the clock and weather
// stay on screen, and hides the cursor after a few seconds of inactivity.
// Any key press, click, or mouse move exits. Entered automatically after an
// idle period, or on demand via the "Launch Screensaver" button on the
// Settings page (which links here with ?screensaver=1).
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
  // These document-level listeners are only attached once already inside
  // screensaver mode, so any event here is a genuine exit signal, including
  // mouse movement.
  exitScreensaverMode();
}

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

// The Settings page's "Launch Screensaver" button links here with
// ?screensaver=1 since the screensaver's content (clock, weather, ads) only
// exists on this page. Fullscreen isn't requested in this case — browsers
// only grant it in direct response to a user gesture on the SAME page, and
// the gesture that led here was a click on the previous page.
(function handleScreensaverLaunchParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("screensaver") === "1") {
    params.delete("screensaver");
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "") + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
    enterScreensaverMode(false);
  }
})();

// ---------- Background Image / Slideshow (see background.js) ----------
applyBackgroundFromStorage();
