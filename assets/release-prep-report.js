(function () {
  "use strict";

  var fileInput = document.getElementById("report-file");
  var source = document.getElementById("report-source");
  var analyze = document.getElementById("report-analyze");
  var result = document.getElementById("report-results");
  var status = document.getElementById("report-status");
  var report = document.getElementById("report-text");
  var cards = document.getElementById("report-cards");
  var copy = document.getElementById("copy-report");
  var audioBuffer = null;
  var fileName = "";

  function formatDuration(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
    return minutes + ":" + remaining;
  }

  function db(value) {
    return value > 0 ? (20 * Math.log10(value)).toFixed(1) + " dBFS" : "-inf dBFS";
  }

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }
    status.textContent = "Reading " + file.name + "...";
    analyze.disabled = true;
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
      audioBuffer = await context.decodeAudioData((await file.arrayBuffer()).slice(0));
      await context.close();
      fileName = file.name;
      analyze.disabled = false;
      status.textContent = "File decoded locally. Select a source declaration and create a report.";
    } catch (error) {
      status.textContent = "This browser could not analyze that audio file. Try WAV or MP3.";
    }
  });

  analyze.addEventListener("click", function () {
    if (!audioBuffer) {
      return;
    }
    var peak = 0;
    var squared = 0;
    var clipped = 0;
    var observations = 0;
    for (var channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
      var data = audioBuffer.getChannelData(channel);
      for (var frame = 0; frame < data.length; frame += 1) {
        var absolute = Math.abs(data[frame]);
        peak = Math.max(peak, absolute);
        squared += data[frame] * data[frame];
        if (absolute >= 0.999) {
          clipped += 1;
        }
        observations += 1;
      }
    }
    var rms = Math.sqrt(squared / observations);
    var clipRatio = (clipped / observations) * 100;
    var clipState = clipped > 0 ? "Potential clipping detected" : "No full-scale clipped samples detected";
    var peakState = peak > 0.98 ? "Very little peak headroom" : "Peak headroom available";
    var sourceState = source.options[source.selectedIndex].text;
    cards.innerHTML = [
      '<div class="result-card"><strong>' + formatDuration(audioBuffer.duration) + '</strong><span>Duration</span></div>',
      '<div class="result-card"><strong>' + audioBuffer.sampleRate + ' Hz</strong><span>Sample rate</span></div>',
      '<div class="result-card"><strong>' + db(peak) + '</strong><span>Peak level</span></div>',
      '<div class="result-card"><strong>' + db(rms) + '</strong><span>Approx. RMS</span></div>',
      '<div class="result-card"><strong>' + audioBuffer.numberOfChannels + '</strong><span>Channels</span></div>',
      '<div class="result-card"><strong>' + clipRatio.toFixed(3) + '%</strong><span>Full-scale samples</span></div>'
    ].join("");
    report.value = [
      "CleanStems Release Prep Report",
      "File: " + fileName,
      "Source declaration: " + sourceState,
      "Duration: " + formatDuration(audioBuffer.duration),
      "Sample rate: " + audioBuffer.sampleRate + " Hz",
      "Channels: " + audioBuffer.numberOfChannels,
      "Peak level: " + db(peak) + " - " + peakState,
      "Approximate RMS: " + db(rms),
      "Clipping scan: " + clipState + " (" + clipRatio.toFixed(3) + "% full-scale samples)",
      "",
      "Next checks:",
      "- Use BPM Tapper and Key Finder for musical notes when needed.",
      "- Review rights and AI disclosure obligations before release.",
      "- This browser-based report is not mastering approval or a distribution license."
    ].join("\n");
    result.classList.remove("hidden");
    status.textContent = "Report created locally. No audio was uploaded to CleanStems.";
  });

  copy.addEventListener("click", function () {
    navigator.clipboard.writeText(report.value).then(function () {
      status.textContent = "Report copied.";
    }).catch(function () {
      status.textContent = "Copy failed. Select the report text manually.";
    });
  });
}());
