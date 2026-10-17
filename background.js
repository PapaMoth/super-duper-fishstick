// ---------- Background Image / Slideshow ----------
// Shared across every page: pick one image for a static background, or
// select multiple images at once to rotate through as a slideshow. Settings
// persist in localStorage so they carry over between all pages. The upload
// controls themselves only live on the Settings page (initBackgroundControls);
// every other page just renders whatever is currently stored
// (applyBackgroundFromStorage), so the chosen background/slideshow shows up
// consistently everywhere.
const BG_IMAGES_STORAGE_KEY = "clockapp-bg-images";
const BG_SLIDESHOW_INTERVAL_KEY = "clockapp-bg-slideshow-interval";
const BG_DEFAULT_INTERVAL_S = 8;
const MAX_BG_IMAGES = 8;

function bgGetIntervalMs() {
  try {
    const v = parseInt(localStorage.getItem(BG_SLIDESHOW_INTERVAL_KEY), 10);
    if (v >= 1 && v <= 120) return v * 1000;
  } catch (e) { /* ignore */ }
  return BG_DEFAULT_INTERVAL_S * 1000;
}

let bgImages = [];
let bgSlideIndex = 0;
let bgSlideInterval = null;

function bgApplyCurrentImage(clearBtn) {
  if (bgImages.length === 0) {
    document.body.style.backgroundImage = "";
    document.body.classList.remove("has-bg-image");
    if (clearBtn) clearBtn.classList.add("hidden");
    return;
  }
  document.body.style.backgroundImage = `url("${bgImages[bgSlideIndex % bgImages.length]}")`;
  document.body.classList.add("has-bg-image");
  if (clearBtn) clearBtn.classList.remove("hidden");
}

function bgStartSlideshowIfNeeded(clearBtn) {
  clearInterval(bgSlideInterval);
  bgSlideInterval = null;
  if (bgImages.length > 1) {
    bgSlideInterval = setInterval(() => {
      bgSlideIndex = (bgSlideIndex + 1) % bgImages.length;
      bgApplyCurrentImage(clearBtn);
    }, bgGetIntervalMs());
  }
}

function bgSetImages(newImages, clearBtn) {
  bgImages = newImages;
  bgSlideIndex = 0;
  bgApplyCurrentImage(clearBtn);
  bgStartSlideshowIfNeeded(clearBtn);
}

// Renders whatever background is currently stored, with no upload UI. Call
// this on every page that should show the shared background (dashboard,
// calendar) but doesn't itself offer the upload controls.
function applyBackgroundFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(BG_IMAGES_STORAGE_KEY) || "[]");
    if (Array.isArray(saved) && saved.length > 0) bgSetImages(saved, null);
  } catch (e) { /* storage unavailable or corrupt */ }
}

// Wires up the full upload/clear UI. Only called on the Settings page.
function initBackgroundControls({ uploadBtnId, uploadInputId, clearBtnId, statusId }) {
  const uploadBtn = document.getElementById(uploadBtnId);
  const uploadInput = document.getElementById(uploadInputId);
  const clearBtn = document.getElementById(clearBtnId);
  const statusEl = statusId ? document.getElementById(statusId) : null;
  if (!uploadBtn || !uploadInput || !clearBtn) return;

  let requestId = 0;

  function persist() {
    try {
      localStorage.setItem(BG_IMAGES_STORAGE_KEY, JSON.stringify(bgImages));
    } catch (e) {
      if (statusEl) statusEl.textContent = "Note: background could not be saved (storage limit) — it still shows for this session.";
    }
  }

  uploadBtn.addEventListener("click", () => uploadInput.click());

  uploadInput.addEventListener("change", () => {
    const files = Array.from(uploadInput.files || []).filter((f) => f.type.startsWith("image/"));
    uploadInput.value = "";
    if (files.length === 0) return;
    if (files.length > MAX_BG_IMAGES) {
      if (statusEl) statusEl.textContent = `Please choose up to ${MAX_BG_IMAGES} images at a time.`;
      return;
    }
    const thisRequest = ++requestId;
    if (statusEl) statusEl.textContent = files.length > 1 ? `Loading ${files.length} images…` : "";
    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    }))).then((dataUrls) => {
      if (thisRequest !== requestId) return; // a newer selection has started
      bgSetImages(dataUrls, clearBtn);
      persist();
      if (statusEl) {
        statusEl.textContent = dataUrls.length > 1
          ? `Slideshow of ${dataUrls.length} images (rotates every ${bgGetIntervalMs() / 1000}s).`
          : "";
      }
    }).catch(() => {
      if (thisRequest !== requestId) return;
      if (statusEl) statusEl.textContent = "Could not read one or more of those images.";
    });
  });

  clearBtn.addEventListener("click", () => {
    requestId++; // invalidate any upload whose reads haven't resolved yet
    bgSetImages([], clearBtn);
    try { localStorage.removeItem(BG_IMAGES_STORAGE_KEY); } catch (e) { /* storage unavailable */ }
    if (statusEl) statusEl.textContent = "";
  });

  try {
    const saved = JSON.parse(localStorage.getItem(BG_IMAGES_STORAGE_KEY) || "[]");
    if (Array.isArray(saved) && saved.length > 0) {
      bgSetImages(saved, clearBtn);
      if (statusEl && saved.length > 1) {
        statusEl.textContent = `Slideshow of ${saved.length} images (rotates every ${bgGetIntervalMs() / 1000}s).`;
      }
    }
  } catch (e) { /* storage unavailable or corrupt */ }

  const timerRange = document.getElementById("bg-timer-range");
  const timerValue = document.getElementById("bg-timer-value");
  if (timerRange && timerValue) {
    const currentS = bgGetIntervalMs() / 1000;
    timerRange.value = currentS;
    timerValue.textContent = currentS + "s";
    timerRange.addEventListener("input", () => {
      const s = parseInt(timerRange.value, 10);
      timerValue.textContent = s + "s";
      try { localStorage.setItem(BG_SLIDESHOW_INTERVAL_KEY, String(s)); } catch (e) { /* ignore */ }
      bgStartSlideshowIfNeeded(clearBtn);
      if (statusEl && bgImages.length > 1) {
        statusEl.textContent = `Slideshow of ${bgImages.length} images (rotates every ${s}s).`;
      }
    });
  }
}
