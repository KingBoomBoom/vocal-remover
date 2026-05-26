(function () {
  "use strict";

  var fileInput = document.getElementById("silence-file");
  var originalAudio = document.getElementById("silence-original");
  var resultAudio = document.getElementById("silence-result");
  var controls = document.getElementById("silence-controls");
  var threshold = document.getElementById("silence-threshold");
  var thresholdValue = document.getElementById("silence-threshold-value");
  var duration = document.getElementById("silence-duration");
  var padding = document.getElementById("silence-padding");
  var analyzeButton = document.getElementById("silence-analyze");
  var downloadButton = document.getElementById("silence-download");
  var summary = document.getElementById("silence-summary");
  var status = document.getElementById("silence-status");
  var audioBuffer = null;
  var outputBlob = null;
  var sourceUrl = null;
  var resultUrl = null;

  function writeString(view, offset, text) {
    for (var i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }

  function encodeWav(channels, sampleRate) {
    var count = Math.min(channels.length, 2);
    var frames = channels[0].length;
    var dataLength = frames * count * 2;
    var buffer = new ArrayBuffer(44 + dataLength);
    var view = new DataView(buffer);
    var offset = 0;
    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, 36 + dataLength, true); offset += 4;
    writeString(view, offset, "WAVE"); offset += 4;
    writeString(view, offset, "fmt "); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, count, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * count * 2, true); offset += 4;
    view.setUint16(offset, count * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, "data"); offset += 4;
    view.setUint32(offset, dataLength, true); offset += 4;
    for (var frame = 0; frame < frames; frame += 1) {
      for (var channel = 0; channel < count; channel += 1) {
        var sample = Math.max(-1, Math.min(1, channels[channel][frame]));
        view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  function formatTime(seconds) {
    return seconds.toFixed(2) + "s";
  }

  function detectRemovals(buffer, thresholdDb, minSeconds, padSeconds) {
    var sampleRate = buffer.sampleRate;
    var windowFrames = Math.max(1, Math.floor(sampleRate * 0.02));
    var limit = Math.pow(10, thresholdDb / 20);
    var minFrames = Math.floor(minSeconds * sampleRate);
    var padFrames = Math.floor(padSeconds * sampleRate);
    var ranges = [];
    var start = null;
    for (var frame = 0; frame < buffer.length; frame += windowFrames) {
      var end = Math.min(buffer.length, frame + windowFrames);
      var peak = 0;
      for (var channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        var data = buffer.getChannelData(channel);
        for (var i = frame; i < end; i += 1) {
          peak = Math.max(peak, Math.abs(data[i]));
        }
      }
      if (peak <= limit && start === null) {
        start = frame;
      }
      if ((peak > limit || end === buffer.length) && start !== null) {
        var stop = peak > limit ? frame : end;
        if (stop - start >= minFrames) {
          var trimStart = Math.min(stop, start + padFrames);
          var trimEnd = Math.max(trimStart, stop - padFrames);
          if (trimEnd > trimStart) {
            ranges.push({ start: trimStart, end: trimEnd });
          }
        }
        start = null;
      }
    }
    return ranges;
  }

  function renderWithoutRanges(buffer, ranges) {
    var keep = [];
    var cursor = 0;
    ranges.forEach(function (range) {
      if (range.start > cursor) {
        keep.push({ start: cursor, end: range.start });
      }
      cursor = range.end;
    });
    if (cursor < buffer.length) {
      keep.push({ start: cursor, end: buffer.length });
    }
    var outputLength = keep.reduce(function (total, range) {
      return total + range.end - range.start;
    }, 0);
    var count = Math.min(buffer.numberOfChannels, 2);
    var output = [];
    var fadeFrames = Math.floor(buffer.sampleRate * 0.006);
    for (var channel = 0; channel < count; channel += 1) {
      output[channel] = new Float32Array(outputLength);
      var destination = 0;
      var input = buffer.getChannelData(channel);
      keep.forEach(function (range, index) {
        for (var frame = range.start; frame < range.end; frame += 1) {
          var value = input[frame];
          var local = frame - range.start;
          var span = range.end - range.start;
          if (index > 0 && local < fadeFrames) {
            value *= local / fadeFrames;
          }
          if (index < keep.length - 1 && span - local <= fadeFrames) {
            value *= (span - local) / fadeFrames;
          }
          output[channel][destination] = value;
          destination += 1;
        }
      });
    }
    return output;
  }

  threshold.addEventListener("input", function () {
    thresholdValue.textContent = threshold.value + " dB";
  });

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }
    status.textContent = "Decoding " + file.name + "...";
    outputBlob = null;
    downloadButton.disabled = true;
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
      audioBuffer = await context.decodeAudioData((await file.arrayBuffer()).slice(0));
      await context.close();
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
      sourceUrl = URL.createObjectURL(file);
      originalAudio.src = sourceUrl;
      originalAudio.classList.remove("hidden");
      controls.classList.remove("hidden");
      status.textContent = file.name + " loaded. Duration " + formatTime(audioBuffer.duration) + ".";
    } catch (error) {
      status.textContent = "This file could not be decoded in your browser. Try WAV or MP3.";
    }
  });

  analyzeButton.addEventListener("click", function () {
    if (!audioBuffer) {
      return;
    }
    var minSeconds = Number(duration.value) / 1000;
    var padSeconds = Number(padding.value) / 1000;
    var removals = detectRemovals(audioBuffer, Number(threshold.value), minSeconds, padSeconds);
    if (!removals.length) {
      status.textContent = "No removable silent segments matched these settings. Adjust the threshold or minimum pause length.";
      return;
    }
    var removedFrames = removals.reduce(function (sum, range) {
      return sum + range.end - range.start;
    }, 0);
    var rendered = renderWithoutRanges(audioBuffer, removals);
    outputBlob = encodeWav(rendered, audioBuffer.sampleRate);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    resultUrl = URL.createObjectURL(outputBlob);
    resultAudio.src = resultUrl;
    resultAudio.classList.remove("hidden");
    downloadButton.disabled = false;
    summary.textContent = removals.length + " silent region(s) removed, shortening the file by " + formatTime(removedFrames / audioBuffer.sampleRate) + ".";
    status.textContent = "Preview the processed WAV before downloading.";
    if (window.cleanStemsTrack) {
      window.cleanStemsTrack("silence_processed", { removed_regions: removals.length });
    }
  });

  downloadButton.addEventListener("click", function () {
    if (!outputBlob) {
      return;
    }
    var link = document.createElement("a");
    link.href = resultUrl;
    link.download = "cleanstems-silence-removed.wav";
    link.click();
    status.textContent = "Processed WAV downloaded.";
    if (window.cleanStemsTrack) {
      window.cleanStemsTrack("silence_downloaded");
    }
  });
}());
