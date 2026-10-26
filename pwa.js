// Registers the service worker so Chrome on Android (and desktop) offers
// to install this site as an app. Safe to include on every page; the
// browser only prompts once per origin.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline install just won't be available */ });
  });
}
