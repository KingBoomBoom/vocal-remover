(function () {
  "use strict";

  var fileInput = document.getElementById("key-file");
  var analyzeButton = document.getElementById("key-analyze");
  var details = document.getElementById("key-details");
  var status = document.getElementById("key-status");
  var results = document.getElementById("key-results");
  var topKey = document.getElementById("key-top");
  var topNote = document.getElementById("key-note");
  var alternatives = document.getElementById("key-alternatives");
  var chromaList = document.getElementById("chroma-list");
  var audioBuffer = null;
  var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  var minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  function monoDownsample(buffer) {
    var step = Math.max(1, Math.floor(buffer.sampleRate / 11025));
    var maxInput = Math.min(buffer.length, buffer.sampleRate * 30);
    var length = Math.floor(maxInput / step);
    var output = new Float32Array(length);
    for (var i = 0; i < length; i += 1) {
      var inputIndex = i * step;
      var sum = 0;
      for (var channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        sum += buffer.getChannelData(channel)[inputIndex];
      }
      output[i] = sum / buffer.numberOfChannels;
    }
    return { samples: output, sampleRate: buffer.sampleRate / step };
  }

  function goertzel(samples, offset, length, frequency, sampleRate) {
    var omega = 2 * Math.PI * frequency / sampleRate;
    var coefficient = 2 * Math.cos(omega);
    var previous = 0;
    var previousTwo = 0;
    for (var i = 0; i < length; i += 1) {
      var windowed = samples[offset + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (length - 1)));
      var current = windowed + coefficient * previous - previousTwo;
      previousTwo = previous;
      previous = current;
    }
    return Math.max(0, previousTwo * previousTwo + previous * previous - coefficient * previous * previousTwo);
  }

  function scoreProfile(chroma, profile, key) {
    var total = 0;
    for (var i = 0; i < 12; i += 1) {
      total += chroma[(i + key) % 12] * profile[i];
    }
    return total;
  }

  function analyze(buffer) {
    var source = monoDownsample(buffer);
    var size = 2048;
    var hop = 2048;
    var chroma = new Array(12).fill(0);
    for (var offset = 0; offset + size < source.samples.length; offset += hop) {
      for (var midi = 36; midi < 84; midi += 1) {
        var frequency = 440 * Math.pow(2, (midi - 69) / 12);
        var energy = goertzel(source.samples, offset, size, frequency, source.sampleRate);
        chroma[midi % 12] += Math.log(1 + energy);
      }
    }
    var peak = Math.max.apply(null, chroma) || 1;
    chroma = chroma.map(function (value) { return value / peak; });
    var candidates = [];
    for (var key = 0; key < 12; key += 1) {
      candidates.push({ name: noteNames[key] + " major", score: scoreProfile(chroma, majorProfile, key) });
      candidates.push({ name: noteNames[key] + " minor", score: scoreProfile(chroma, minorProfile, key) });
    }
    candidates.sort(function (a, b) { return b.score - a.score; });
    return { chroma: chroma, candidates: candidates };
  }

  function render(result) {
    var first = result.candidates[0];
    var second = result.candidates[1];
    var separation = Math.max(0, Math.min(100, Math.round((first.score - second.score) / first.score * 350)));
    topKey.textContent = first.name;
    topNote.textContent = "Estimate strength: " + (separation < 20 ? "low" : separation < 45 ? "medium" : "higher") + ". Verify by ear or in a DAW.";
    alternatives.innerHTML = "";
    result.candidates.slice(1, 4).forEach(function (candidate) {
      var card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = "<strong>" + candidate.name + "</strong><span>Alternative estimate</span>";
      alternatives.appendChild(card);
    });
    chromaList.innerHTML = "";
    result.chroma.forEach(function (amount, index) {
      var row = document.createElement("div");
      row.className = "chroma-row";
      row.innerHTML = "<span>" + noteNames[index] + "</span><div class=\"chroma-track\"><div class=\"chroma-fill\" style=\"width:" + Math.round(amount * 100) + "%\"></div></div>";
      chromaList.appendChild(row);
    });
    results.classList.remove("hidden");
  }

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) { return; }
    results.classList.add("hidden");
    analyzeButton.disabled = true;
    details.textContent = "Loading " + file.name + " locally...";
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
      audioBuffer = await context.decodeAudioData(await file.arrayBuffer());
      await context.close();
      details.textContent = file.name + " loaded. Analysis samples up to the first 30 seconds.";
      analyzeButton.disabled = false;
    } catch (error) {
      audioBuffer = null;
      details.textContent = "This browser could not decode the file. Try WAV or MP3.";
    }
  });

  analyzeButton.addEventListener("click", function () {
    if (!audioBuffer) { return; }
    analyzeButton.disabled = true;
    status.textContent = "Estimating key locally. This can take a moment...";
    window.setTimeout(function () {
      try {
        render(analyze(audioBuffer));
        status.textContent = "Analysis complete. Key detection is an estimate, especially for short or atonal audio.";
      } catch (error) {
        status.textContent = "Analysis failed in this browser.";
      }
      analyzeButton.disabled = false;
    }, 20);
  });
}());
