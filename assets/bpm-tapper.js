(function () {
  "use strict";

  var value = document.getElementById("bpm-value");
  var description = document.getElementById("bpm-description");
  var status = document.getElementById("tap-status");
  var tapButton = document.getElementById("tap-button");
  var resetButton = document.getElementById("reset-bpm");
  var taps = [];

  function describeTempo(bpm) {
    if (bpm < 70) { return "Slow tempo"; }
    if (bpm < 105) { return "Moderate tempo"; }
    if (bpm < 135) { return "Upbeat tempo"; }
    return "Fast tempo";
  }

  function reset() {
    taps = [];
    value.textContent = "--";
    description.textContent = "Tap at least twice";
    status.textContent = "No audio upload needed. Taps are calculated on this device.";
  }

  function tap() {
    var now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 3000) {
      taps = [];
    }
    taps.push(now);
    if (taps.length > 9) {
      taps.shift();
    }
    if (taps.length < 2) {
      value.textContent = "--";
      description.textContent = "Keep tapping";
      status.textContent = "1 tap recorded. Tap steadily with the beat.";
      return;
    }
    var total = 0;
    for (var i = 1; i < taps.length; i += 1) {
      total += taps[i] - taps[i - 1];
    }
    var bpm = Math.round(60000 / (total / (taps.length - 1)));
    value.textContent = String(bpm);
    description.textContent = describeTempo(bpm);
    status.textContent = taps.length + " taps averaged. Keep tapping to stabilize the estimate.";
  }

  tapButton.addEventListener("click", tap);
  resetButton.addEventListener("click", reset);
  document.addEventListener("keydown", function (event) {
    if (event.code === "Space" && event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
      event.preventDefault();
      tap();
    }
  });
}());
