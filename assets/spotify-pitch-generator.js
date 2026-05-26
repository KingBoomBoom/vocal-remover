(function () {
  "use strict";

  var form = document.getElementById("pitch-form");
  var output = document.getElementById("pitch-output");
  var status = document.getElementById("pitch-status");
  var result = document.getElementById("pitch-results");
  var copy = document.getElementById("copy-pitch");

  function value(id) {
    return document.getElementById(id).value.trim().replace(/\s+/g, " ");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var title = value("pitch-title");
    var genre = value("pitch-genre");
    var mood = value("pitch-mood");
    var instruments = value("pitch-instruments");
    var story = value("pitch-story");
    var audience = value("pitch-audience");
    var promotion = value("pitch-promotion");
    var text = [
      title + " is an original " + genre + " track with a " + mood + " feel, built around " + instruments + ".",
      story + ".",
      "It is intended for " + audience + ".",
      "Release support: " + promotion + "."
    ].join(" ");
    output.value = text;
    result.classList.remove("hidden");
    status.textContent = "Draft generated locally. Edit it for accuracy before using Spotify for Artists.";
    if (window.cleanStemsTrack) {
      window.cleanStemsTrack("pitch_draft_generated");
    }
  });

  copy.addEventListener("click", function () {
    navigator.clipboard.writeText(output.value).then(function () {
      status.textContent = "Pitch draft copied.";
    }).catch(function () {
      status.textContent = "Copy failed. Select the draft manually.";
    });
  });
}());
