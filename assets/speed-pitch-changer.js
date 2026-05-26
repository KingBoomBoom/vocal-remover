(function () {
  "use strict";

  var fileInput = document.getElementById("speed-file");
  var player = document.getElementById("speed-player");
  var controls = document.getElementById("speed-controls");
  var speedInput = document.getElementById("speed-rate");
  var speedOutput = document.getElementById("speed-output");
  var preserveInput = document.getElementById("preserve-pitch");
  var pitchOutput = document.getElementById("pitch-output");
  var details = document.getElementById("speed-details");
  var status = document.getElementById("speed-status");
  var url = null;
  var trackedStart = false;

  function updatePlayback() {
    var rate = Number(speedInput.value);
    var preserve = preserveInput.checked;
    player.playbackRate = rate;
    player.preservesPitch = preserve;
    player.webkitPreservesPitch = preserve;
    speedOutput.textContent = rate.toFixed(2) + "x";
    if (preserve) {
      pitchOutput.textContent = "Pitch preserved";
      status.textContent = "Practice speed changes while your browser attempts to keep the original pitch.";
    } else {
      var semitones = 12 * Math.log(rate) / Math.log(2);
      pitchOutput.textContent = (semitones >= 0 ? "+" : "") + semitones.toFixed(1) + " semitones";
      status.textContent = "Tape-style mode: pitch follows speed. Semitone value is approximate.";
    }
  }

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) { return; }
    if (url) { URL.revokeObjectURL(url); }
    url = URL.createObjectURL(file);
    player.src = url;
    player.classList.remove("hidden");
    controls.classList.remove("hidden");
    details.textContent = file.name + " loaded locally. Play it and adjust practice speed.";
    updatePlayback();
  });
  speedInput.addEventListener("input", updatePlayback);
  preserveInput.addEventListener("change", updatePlayback);
  player.addEventListener("play", function () {
    if (!trackedStart && window.cleanStemsTrack) {
      window.cleanStemsTrack("speed_practice_started", { preserve_pitch: preserveInput.checked });
      trackedStart = true;
    }
  });
  document.querySelectorAll("[data-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      speedInput.value = button.getAttribute("data-rate");
      updatePlayback();
    });
  });
  updatePlayback();
}());
