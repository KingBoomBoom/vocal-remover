(function () {
  "use strict";

  function excluded() {
    var host = window.location.hostname;
    // Keep preview deployments and other copies out of the production property.
    if (host !== "www.cleanstems.com" && host !== "cleanstems.com") return true;
    if (!host || /^(localhost|127(?:\.\d+){3}|\[?::1\]?)$/.test(host) || /\.(localhost|local|test)$/.test(host)) return true;
    try { return window.localStorage.getItem("cleanstems_exclude_analytics") === "1"; }
    catch (_) { return false; }
  }
  window.cleanStemsTrack = function () {};
  if (excluded()) return;

  var measurementId = "G-HW0QFB94G3";
  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(tag);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  window.cleanStemsTrack = function (eventName, parameters) {
    if (excluded()) return;
    window.gtag("event", eventName, parameters || {});
  };

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-analytics-event]");
    if (!target) {
      return;
    }
    var parameters = {};
    var location = target.getAttribute("data-analytics-location");
    if (location) {
      parameters.tool_location = location;
    }
    window.cleanStemsTrack(target.getAttribute("data-analytics-event"), parameters);
  });
}());
