// ---------- Clock ----------
function pad(n) { return n.toString().padStart(2, "0"); }

function updateClock() {
  const now = new Date();
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  document.getElementById("clock").textContent = `${h}:${m}:${s}`;
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}
setInterval(updateClock, 1000);
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
