(function () {
  "use strict";

  var bpmInput = document.getElementById("metro-bpm");
  var bpmOutput = document.getElementById("metro-bpm-output");
  var beatsInput = document.getElementById("metro-beats");
  var accentInput = document.getElementById("metro-accent");
  var playButton = document.getElementById("metro-play");
  var tapButton = document.getElementById("metro-tap");
  var status = document.getElementById("metro-status");
  var dots = document.getElementById("metro-dots");
  var context = null;
  var timer = null;
  var nextTime = 0;
  var beat = 0;
  var taps = [];
  var trackedStart = false;

  function bpm() { return Number(bpmInput.value); }

  function drawDots(activeBeat) {
    var beats = Number(beatsInput.value);
    dots.innerHTML = "";
    for (var i = 0; i < beats; i += 1) {
      var dot = document.createElement("span");
      dot.className = "metro-beat";
      if (i === activeBeat) { dot.className += i === 0 && accentInput.checked ? " accent" : " active"; }
      dots.appendChild(dot);
    }
  }

  function click(time, accented) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = accented ? 1320 : 880;
    gain.gain.setValueAtTime(accented ? 0.28 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.05);
  }

  function scheduler() {
    while (nextTime < context.currentTime + 0.1) {
      var currentBeat = beat;
      click(nextTime, currentBeat === 0 && accentInput.checked);
      window.setTimeout(function (shownBeat) { drawDots(shownBeat); }, Math.max(0, (nextTime - context.currentTime) * 1000), currentBeat);
      nextTime += 60 / bpm();
      beat = (beat + 1) % Number(beatsInput.value);
    }
  }

  async function togglePlay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
      playButton.textContent = "Start Metronome";
      drawDots(-1);
      status.textContent = "Metronome stopped.";
      return;
    }
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    context = context || new AudioContext();
    await context.resume();
    beat = 0;
    nextTime = context.currentTime + 0.04;
    scheduler();
    timer = window.setInterval(scheduler, 25);
    playButton.textContent = "Stop Metronome";
    status.textContent = "Playing " + bpm() + " BPM in " + beatsInput.value + "/4.";
    if (!trackedStart && window.cleanStemsTrack) {
      window.cleanStemsTrack("metronome_started", { beats_per_bar: beatsInput.value });
      trackedStart = true;
    }
  }

  function setBpm(value) {
    bpmInput.value = String(Math.min(240, Math.max(30, Math.round(value))));
    bpmOutput.textContent = bpmInput.value + " BPM";
    if (timer) { status.textContent = "Playing " + bpm() + " BPM in " + beatsInput.value + "/4."; }
  }

  bpmInput.addEventListener("input", function () { setBpm(bpmInput.value); });
  beatsInput.addEventListener("change", function () {
    beat = 0;
    drawDots(-1);
    if (timer) { status.textContent = "Playing " + bpm() + " BPM in " + beatsInput.value + "/4."; }
  });
  accentInput.addEventListener("change", function () { drawDots(-1); });
  playButton.addEventListener("click", togglePlay);
  tapButton.addEventListener("click", function () {
    var now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 3000) { taps = []; }
    taps.push(now);
    if (taps.length > 8) { taps.shift(); }
    if (taps.length > 1) {
      var elapsed = taps[taps.length - 1] - taps[0];
      setBpm(60000 * (taps.length - 1) / elapsed);
      status.textContent = "Tempo set from " + taps.length + " taps. Start the metronome to practice.";
    } else {
      status.textContent = "Keep tapping to set the tempo.";
    }
  });

  setBpm(90);
  drawDots(-1);
}());
