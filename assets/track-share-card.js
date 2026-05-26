(function () {
  "use strict";

  var form = document.getElementById("card-form");
  var canvas = document.getElementById("share-canvas");
  var result = document.getElementById("card-result");
  var status = document.getElementById("card-status");
  var download = document.getElementById("download-card");
  var ctx = canvas.getContext("2d");

  function value(id) {
    return document.getElementById(id).value.trim();
  }

  function draw() {
    var title = value("card-title") || "Untitled Track";
    var artist = value("card-artist") || "Independent Artist";
    var mood = value("card-mood") || "Original Demo";
    var bpm = value("card-bpm") || "--";
    var key = value("card-key") || "--";
    var style = document.getElementById("card-style").value;
    var palettes = {
      midnight: ["#111827", "#1d4ed8", "#e5eefc"],
      cassette: ["#18232f", "#0f766e", "#effcf9"],
      vinyl: ["#171717", "#b45309", "#fff7ed"],
      pop: ["#172554", "#db2777", "#fdf2f8"]
    };
    var palette = palettes[style];
    var gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(1, palette[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.fillRect(72, 82, 936, 4);
    ctx.font = "700 26px Arial";
    ctx.fillStyle = palette[2];
    ctx.fillText("CLEANSTEMS / TRACK CARD", 72, 140);
    ctx.font = "700 76px Arial";
    var titleLines = title.length > 24 ? [title.slice(0, 24), title.slice(24, 48)] : [title];
    titleLines.forEach(function (line, index) {
      ctx.fillText(line, 72, 420 + (index * 88));
    });
    ctx.font = "400 34px Arial";
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.fillText(artist, 72, titleLines.length > 1 ? 555 : 505);
    ctx.font = "600 25px Arial";
    ctx.fillStyle = palette[2];
    ctx.fillText(mood.toUpperCase(), 72, 690);
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.fillRect(72, 750, 936, 1);
    ctx.font = "700 46px Arial";
    ctx.fillStyle = palette[2];
    ctx.fillText(bpm + " BPM", 72, 850);
    ctx.fillText(key, 370, 850);
    ctx.font = "400 25px Arial";
    ctx.fillStyle = "rgba(255,255,255,.76)";
    ctx.fillText("Created for permitted original audio workflows", 72, 965);
    result.classList.remove("hidden");
    status.textContent = "Share card rendered locally. Confirm you may publish the supplied title and artwork details.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    draw();
  });

  download.addEventListener("click", function () {
    var link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "cleanstems-track-card.png";
    link.click();
    status.textContent = "PNG card downloaded.";
    if (window.cleanStemsTrack) {
      window.cleanStemsTrack("share_card_downloaded", {
        card_style: document.getElementById("card-style").value
      });
    }
  });
}());
