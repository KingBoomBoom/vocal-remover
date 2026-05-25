(function () {
  "use strict";

  var fileInput = document.getElementById("audio-file");
  var preview = document.getElementById("audio-preview");
  var details = document.getElementById("file-details");
  var controls = document.getElementById("trim-controls");
  var startInput = document.getElementById("start-time");
  var endInput = document.getElementById("end-time");
  var previewButton = document.getElementById("preview-cut");
  var downloadButton = document.getElementById("download-cut");
  var status = document.getElementById("cutter-status");
  var audioBuffer = null;
  var audioUrl = null;
  var previewEnd = null;

  function formatSeconds(seconds) {
    return seconds.toFixed(2) + " seconds";
  }

  function getRange() {
    if (!audioBuffer) {
      throw new Error("Select an audio file first.");
    }
    var start = Number(startInput.value);
    var end = Number(endInput.value);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > audioBuffer.duration) {
      throw new Error("Choose a valid start and end time within the audio duration.");
    }
    return { start: start, end: end };
  }

  function writeString(view, offset, text) {
    for (var i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }

  function encodeWav(buffer, start, end) {
    var sampleRate = buffer.sampleRate;
    var channelCount = Math.min(buffer.numberOfChannels, 2);
    var startFrame = Math.floor(start * sampleRate);
    var endFrame = Math.floor(end * sampleRate);
    var frameCount = endFrame - startFrame;
    var bytesPerSample = 2;
    var dataLength = frameCount * channelCount * bytesPerSample;
    var output = new ArrayBuffer(44 + dataLength);
    var view = new DataView(output);
    var offset = 0;

    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, 36 + dataLength, true); offset += 4;
    writeString(view, offset, "WAVE"); offset += 4;
    writeString(view, offset, "fmt "); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, channelCount, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * channelCount * bytesPerSample, true); offset += 4;
    view.setUint16(offset, channelCount * bytesPerSample, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, "data"); offset += 4;
    view.setUint32(offset, dataLength, true); offset += 4;

    for (var frame = startFrame; frame < endFrame; frame += 1) {
      for (var channel = 0; channel < channelCount; channel += 1) {
        var sample = buffer.getChannelData(channel)[frame];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
        offset += 2;
      }
    }
    return new Blob([output], { type: "audio/wav" });
  }

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }
    controls.classList.add("hidden");
    preview.classList.add("hidden");
    details.textContent = "Loading " + file.name + "...";
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
      var data = await file.arrayBuffer();
      audioBuffer = await context.decodeAudioData(data.slice(0));
      await context.close();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      audioUrl = URL.createObjectURL(file);
      preview.src = audioUrl;
      preview.classList.remove("hidden");
      startInput.max = audioBuffer.duration.toFixed(2);
      endInput.max = audioBuffer.duration.toFixed(2);
      startInput.value = "0";
      endInput.value = audioBuffer.duration.toFixed(2);
      details.textContent = file.name + " loaded - duration " + formatSeconds(audioBuffer.duration) + ".";
      status.textContent = "";
      controls.classList.remove("hidden");
    } catch (error) {
      details.textContent = "This browser could not decode that file. Try an MP3 or WAV file.";
      audioBuffer = null;
    }
  });

  preview.addEventListener("timeupdate", function () {
    if (previewEnd !== null && preview.currentTime >= previewEnd) {
      preview.pause();
      previewEnd = null;
    }
  });

  previewButton.addEventListener("click", function () {
    try {
      var range = getRange();
      preview.currentTime = range.start;
      previewEnd = range.end;
      preview.play();
      status.textContent = "Previewing " + formatSeconds(range.end - range.start) + " of audio.";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  downloadButton.addEventListener("click", function () {
    try {
      var range = getRange();
      var clip = encodeWav(audioBuffer, range.start, range.end);
      var url = URL.createObjectURL(clip);
      var download = document.createElement("a");
      download.href = url;
      download.download = "cleanstems-cut.wav";
      download.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      status.textContent = "Downloaded a WAV clip lasting " + formatSeconds(range.end - range.start) + ".";
    } catch (error) {
      status.textContent = error.message;
    }
  });
}());
