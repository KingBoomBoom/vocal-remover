(function () {
  "use strict";

  var form = document.getElementById("provenance-form");
  var output = document.getElementById("provenance-output");
  var status = document.getElementById("provenance-status");
  var result = document.getElementById("provenance-results");
  var copy = document.getElementById("copy-provenance");

  function value(id) {
    return document.getElementById(id).value.trim();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var assisted = document.getElementById("provenance-ai").checked;
    var disclosure = assisted ?
      "AI-assisted elements were used in creating this audio. Human review and editing were performed before publication." :
      "No AI-generated audio elements declared for this project.";
    output.value = [
      "CleanStems Audio Source Record",
      "Track/project: " + value("provenance-title"),
      "Creator: " + value("provenance-creator"),
      "Source type: " + value("provenance-source"),
      "Creation or export date: " + value("provenance-date"),
      "Generation/service note: " + (value("provenance-service") || "Not applicable"),
      "License or permission record: " + value("provenance-license"),
      "Planned destination: " + value("provenance-destination"),
      "",
      "Suggested disclosure text:",
      disclosure,
      "",
      "Reminder: this record documents your declaration only. It does not prove ownership, grant a license or satisfy every platform requirement."
    ].join("\n");
    result.classList.remove("hidden");
    status.textContent = "Source record generated locally. Keep your underlying license or creation records separately.";
    if (window.cleanStemsTrack) {
      window.cleanStemsTrack("source_record_generated", { ai_assisted: assisted });
    }
  });

  copy.addEventListener("click", function () {
    navigator.clipboard.writeText(output.value).then(function () {
      status.textContent = "Source record copied.";
    }).catch(function () {
      status.textContent = "Copy failed. Select the text manually.";
    });
  });
}());
