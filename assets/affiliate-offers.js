(function () {
  "use strict";
  var provider = (window.cleanStemsOffers || {}).lalal;
  if (!provider || !provider.enabled || !provider.payoutConfirmed || !provider.url) return;
  var url;
  try { url = new URL(provider.url); } catch (_) { return; }
  // Keep the dashboard-issued URL intact. Never guess a referral or Sub-ID parameter.
  if (url.protocol !== "https:" || url.username || url.password || !/(^|\.)lalal\.ai$/.test(url.hostname) || /YOUR_|PLACEHOLDER/i.test(provider.url)) return;
  var sent = new Set();
  document.querySelectorAll("[data-offer-slot]").forEach(function (slot) {
    var id = slot.dataset.offerSlot;
    var cleaner = slot.dataset.offerKind === "cleaner";
    var card = document.createElement("aside");
    card.className = "utility-box affiliate-offer";
    var disclosure = document.createElement("p");
    disclosure.textContent = "Affiliate recommendation: we may earn a commission if you purchase through this link.";
    var title = document.createElement("h2");
    title.textContent = cleaner ? "Need to reduce background noise too?" : "Need more stem separation options?";
    var body = document.createElement("p");
    body.textContent = cleaner ? "Removing pauses does not remove noise during speech. Explore LALAL.AI’s separate audio-cleaning tools and review its preview before buying." : "Explore LALAL.AI’s paid separation options. Compare its preview with your current result before deciding; results vary by recording.";
    var link = document.createElement("a");
    link.textContent = "Explore LALAL.AI";
    link.href = url.href;
    link.target = "_blank";
    link.rel = "sponsored noopener noreferrer";
    link.className = "btn secondary";
    function track(name) {
      if (window.cleanStemsTrack) window.cleanStemsTrack(name, { offer_id: id, offer_provider: "lalal", page_path: location.pathname, transport_type: "beacon" });
    }
    link.addEventListener("click", function () { track("offer_click"); });
    link.addEventListener("auxclick", function (event) { if (event.button === 1) track("offer_click"); });
    card.append(disclosure, title, body, link);
    slot.appendChild(card);
    if (!window.IntersectionObserver) return;
    var visible = false;
    var timer;
    function cancel() { clearTimeout(timer); timer = null; }
    function schedule() {
      cancel();
      if (!visible || document.visibilityState !== "visible" || sent.has(id)) return;
      timer = setTimeout(function () {
        if (visible && document.visibilityState === "visible" && !sent.has(id)) {
          sent.add(id);
          track("offer_impression");
          observer.disconnect();
          document.removeEventListener("visibilitychange", schedule);
        }
      }, 1000);
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible = entry.isIntersecting && entry.intersectionRatio >= 0.5; schedule(); });
    }, { threshold: [0, 0.5] });
    observer.observe(card);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("pagehide", function () { visible = false; cancel(); });
    window.addEventListener("pageshow", function () {
      if (!sent.has(id)) { observer.disconnect(); observer.observe(card); }
    });
  });
}());
