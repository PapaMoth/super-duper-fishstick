// ---------- Clock Display preference ----------
// The toggle lives here; the Dashboard page reads this same localStorage
// key on load to decide whether to show the digital or analog face.
const CLOCK_MODE_KEY = "clockapp-clock-mode";
let clockMode = "digital";
try {
  clockMode = localStorage.getItem(CLOCK_MODE_KEY) || "digital";
} catch (e) { /* storage unavailable */ }

function applyClockModeButtons() {
  document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.clockMode === clockMode);
  });
}

document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clockMode = btn.dataset.clockMode;
    try { localStorage.setItem(CLOCK_MODE_KEY, clockMode); } catch (e) { btn.closest(".settings-section").querySelector(".status").textContent = "Note: clock display could not be saved (storage unavailable)."; }
    applyClockModeButtons();
  });
});

applyClockModeButtons();

// ---------- Background Image / Slideshow (see background.js) ----------
initBackgroundControls({
  uploadBtnId: "bg-upload-btn",
  uploadInputId: "bg-upload-input",
  clearBtnId: "bg-clear-btn",
  statusId: "bg-status"
});
