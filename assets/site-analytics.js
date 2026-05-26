(function () {
  "use strict";

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
