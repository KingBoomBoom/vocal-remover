(function () {
  "use strict";

  var form = document.getElementById("prompt-form");
  var preset = document.getElementById("prompt-preset");
  var platform = document.getElementById("prompt-platform");
  var purpose = document.getElementById("prompt-purpose");
  var genre = document.getElementById("prompt-genre");
  var mood = document.getElementById("prompt-mood");
  var tempo = document.getElementById("prompt-tempo");
  var duration = document.getElementById("prompt-duration");
  var instruments = document.getElementById("prompt-instruments");
  var vocals = document.getElementById("prompt-vocals");
  var structure = document.getElementById("prompt-structure");
  var avoid = document.getElementById("prompt-avoid");
  var output = document.getElementById("prompt-output");
  var shortOutput = document.getElementById("prompt-short-output");
  var platformNote = document.getElementById("prompt-platform-note");
  var status = document.getElementById("prompt-status");
  var result = document.getElementById("prompt-result");
  var copyLong = document.getElementById("copy-full-prompt");
  var copyShort = document.getElementById("copy-short-prompt");

  var presets = {
    "vinyl-lofi": {
      genre: "lo-fi instrumental",
      mood: "warm, reflective, understated",
      tempo: "78",
      instruments: "dusty electric piano, muted bass, soft drums, subtle vinyl texture",
      vocals: "instrumental only",
      structure: "short intro, relaxed main loop, gentle variation, clean outro"
    },
    "cassette-bedroom-pop": {
      genre: "bedroom pop",
      mood: "nostalgic, intimate, hopeful",
      tempo: "94",
      instruments: "chorused guitar, soft synth pad, cassette-style drum texture",
      vocals: "light original vocal hook or instrumental version",
      structure: "intro, verse, hook, instrumental break, final hook"
    },
    "y2k-pop": {
      genre: "Y2K-inspired pop instrumental",
      mood: "bright, confident, playful",
      tempo: "112",
      instruments: "glossy synths, punchy drums, clean bass, rhythmic guitar",
      vocals: "instrumental only",
      structure: "instant hook intro, verse bed, rising pre-chorus, chorus, outro"
    },
    "retro-hip-hop": {
      genre: "retro hip-hop instrumental",
      mood: "focused, cinematic, laid-back",
      tempo: "88",
      instruments: "sample-free keys, round bass, crisp kick and snare, tape texture",
      vocals: "instrumental only",
      structure: "four-bar intro, sixteen-bar verse bed, hook variation, clean ending"
    },
    "record-store-jazz": {
      genre: "small jazz ensemble ambience",
      mood: "calm, sophisticated, late-afternoon",
      tempo: "92",
      instruments: "upright bass, brushed drums, piano, restrained saxophone phrases",
      vocals: "instrumental only",
      structure: "natural opening, evolving performance, soft resolved ending"
    },
    "nostalgic-photo": {
      genre: "cinematic acoustic underscore",
      mood: "tender, nostalgic, uplifting",
      tempo: "76",
      instruments: "felt piano, acoustic guitar harmonics, light strings, soft percussion",
      vocals: "instrumental only",
      structure: "quiet opening, emotional lift, gentle close"
    }
  };

  var platformNotes = {
    suno: "Prompt prepared for a text-to-music workflow. Check Suno's current plan and rights terms before commercial release.",
    lyria: "Prompt prepared for a short Gemini Lyria music concept. Availability and output controls may vary by product and region.",
    eleven: "Prompt prepared for Eleven Music-style generation. Review current licensing terms for the intended distribution.",
    firefly: "Adobe Firefly Generate Soundtrack focuses on instrumental soundtrack generation, so this version requests instrumental output."
  };

  function fillPreset() {
    var values = presets[preset.value];
    if (!values) {
      return;
    }
    genre.value = values.genre;
    mood.value = values.mood;
    tempo.value = values.tempo;
    instruments.value = values.instruments;
    vocals.value = values.vocals;
    structure.value = values.structure;
  }

  function hasImitationRisk(text) {
    return /(in the style of|sounds? (exactly )?like|voice of|clone|impersonat(e|ing)|cover of)/i.test(text);
  }

  function clean(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function copyText(value, message) {
    if (!navigator.clipboard) {
      status.textContent = "Clipboard access is unavailable in this browser. Select and copy the prompt manually.";
      return;
    }
    navigator.clipboard.writeText(value).then(function () {
      status.textContent = message;
    }).catch(function () {
      status.textContent = "Copy failed. Select and copy the prompt manually.";
    });
  }

  function generatePrompt(event) {
    event.preventDefault();
    var userText = [
      genre.value, mood.value, instruments.value, vocals.value, structure.value, avoid.value
    ].join(" ");
    if (hasImitationRisk(userText)) {
      status.textContent = "Use genre, mood and instrumentation descriptions instead of a named song, artist or cloned voice request.";
      result.classList.add("hidden");
      return;
    }

    var selectedPlatform = platform.value;
    var requestedVocals = selectedPlatform === "firefly" ? "instrumental only" : clean(vocals.value);
    var safety = clean(avoid.value) || "no copyrighted lyrics, no recognizable existing melody, no named artist imitation, no cloned voice";
    var fullPrompt = [
      "Create " + clean(duration.value) + " of " + clean(genre.value) + " for " + clean(purpose.value) + ".",
      "Mood: " + clean(mood.value) + ".",
      "Tempo: approximately " + clean(tempo.value) + " BPM.",
      "Instrumentation: " + clean(instruments.value) + ".",
      "Vocals: " + requestedVocals + ".",
      "Structure: " + clean(structure.value) + ".",
      "Avoid: " + safety + ".",
      "The result should be original and suitable for later BPM, key and stem workflow analysis."
    ].join(" ");
    var concisePrompt = [
      clean(genre.value),
      clean(mood.value),
      clean(tempo.value) + " BPM",
      clean(instruments.value),
      requestedVocals,
      "original composition only"
    ].join(", ");

    output.value = fullPrompt;
    shortOutput.value = concisePrompt;
    platformNote.textContent = platformNotes[selectedPlatform];
    status.textContent = "Prompt generated locally. CleanStems does not send this prompt to a music generation service.";
    result.classList.remove("hidden");
  }

  preset.addEventListener("change", fillPreset);
  form.addEventListener("submit", generatePrompt);
  copyLong.addEventListener("click", function () {
    copyText(output.value, "Full prompt copied.");
  });
  copyShort.addEventListener("click", function () {
    copyText(shortOutput.value, "Short prompt copied.");
  });
  fillPreset();
}());
