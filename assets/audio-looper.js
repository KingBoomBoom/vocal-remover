(function () {
  "use strict";

  var fileInput = document.getElementById("loop-file");
  var player = document.getElementById("loop-player");
  var controls = document.getElementById("loop-controls");
  var details = document.getElementById("loop-details");
  var startInput = document.getElementById("loop-start");
  var endInput = document.getElementById("loop-end");
  var looping = document.getElementById("loop-enabled");
  var playButton = document.getElementById("loop-play");
  var stopButton = document.getElementById("loop-stop");
  var status = document.getElementById("loop-status");
  var url = null;
  var active = false;
  var trackedStart = false;

  function range() {
    var start = Number(startInput.value);
    var end = Number(endInput.value);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > player.duration) {
      throw new Error("Choose a valid loop range within the loaded audio.");
    }
    return { start: start, end: end };
  }

  function stop() {
    active = false;
    player.pause();
    status.textContent = "Stopped. Adjust the range or begin another loop.";
  }

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) { return; }
    if (url) { URL.revokeObjectURL(url); }
    url = URL.createObjectURL(file);
    player.src = url;
    player.classList.remove("hidden");
    controls.classList.add("hidden");
    details.textContent = "Loading " + file.name + "...";
    player.onloadedmetadata = function () {
      startInput.value = "0";
      endInput.value = player.duration.toFixed(2);
      startInput.max = player.duration.toFixed(2);
      endInput.max = player.duration.toFixed(2);
      details.textContent = file.name + " loaded - " + player.duration.toFixed(2) + " seconds.";
      controls.classList.remove("hidden");
      status.textContent = "Set a short practice range, then start looping.";
    };
  });

  player.addEventListener("timeupdate", function () {
    if (!active) { return; }
    try {
      var selected = range();
      if (player.currentTime >= selected.end) {
        if (looping.checked) {
          player.currentTime = selected.start;
          player.play();
        } else {
          stop();
        }
      }
    } catch (error) {
      stop();
      status.textContent = error.message;
    }
  });

  playButton.addEventListener("click", function () {
    try {
      var selected = range();
      player.currentTime = selected.start;
      active = true;
      player.play();
      status.textContent = "Playing " + (selected.end - selected.start).toFixed(2) + " seconds" + (looping.checked ? " on repeat." : " once.");
      if (!trackedStart && window.cleanStemsTrack) {
        window.cleanStemsTrack("audio_loop_started", { repeat_enabled: looping.checked });
        trackedStart = true;
      }
    } catch (error) {
      status.textContent = error.message;
    }
  });

  stopButton.addEventListener("click", stop);
}());
