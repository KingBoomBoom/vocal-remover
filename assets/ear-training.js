(function () {
  "use strict";

  var mode = document.getElementById("training-mode");
  var play = document.getElementById("training-play");
  var choices = document.getElementById("training-choices");
  var feedback = document.getElementById("training-feedback");
  var scoreText = document.getElementById("training-score");
  var context = null;
  var correct = "";
  var score = 0;
  var attempts = 0;
  var answered = false;
  var intervals = [
    { name: "Minor 2nd", semitones: 1 },
    { name: "Major 2nd", semitones: 2 },
    { name: "Minor 3rd", semitones: 3 },
    { name: "Major 3rd", semitones: 4 },
    { name: "Perfect 4th", semitones: 5 },
    { name: "Perfect 5th", semitones: 7 },
    { name: "Octave", semitones: 12 }
  ];
  var chords = [
    { name: "Major Triad", semitones: [0, 4, 7] },
    { name: "Minor Triad", semitones: [0, 3, 7] },
    { name: "Diminished Triad", semitones: [0, 3, 6] },
    { name: "Suspended Fourth", semitones: [0, 5, 7] }
  ];

  function frequency(base, semitones) {
    return base * Math.pow(2, semitones / 12);
  }

  function tone(freq, start, length) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.setValueAtTime(0.18, start + length - 0.04);
    gain.gain.linearRampToValueAtTime(0, start + length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
  }

  function sampleItems(array, answer, number) {
    var others = array.filter(function (item) { return item.name !== answer.name; });
    others.sort(function () { return Math.random() - 0.5; });
    var items = [answer].concat(others.slice(0, number - 1));
    return items.sort(function () { return Math.random() - 0.5; });
  }

  function renderChoices(items) {
    choices.innerHTML = "";
    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = item.name;
      button.addEventListener("click", function () {
        if (answered) {
          return;
        }
        answered = true;
        attempts += 1;
        if (item.name === correct) {
          score += 1;
          feedback.textContent = "Correct: " + correct + ". Play another question.";
        } else {
          feedback.textContent = "Answer: " + correct + ". Listen again before the next question.";
        }
        scoreText.textContent = score + " / " + attempts;
        Array.prototype.forEach.call(choices.querySelectorAll("button"), function (option) {
          option.disabled = true;
        });
      });
      choices.appendChild(button);
    });
  }

  play.addEventListener("click", function () {
    if (!context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    }
    context.resume();
    var base = [220, 246.94, 261.63, 293.66][Math.floor(Math.random() * 4)];
    var start = context.currentTime + 0.05;
    answered = false;
    if (mode.value === "interval") {
      var interval = intervals[Math.floor(Math.random() * intervals.length)];
      correct = interval.name;
      tone(base, start, 0.55);
      tone(frequency(base, interval.semitones), start + 0.7, 0.55);
      renderChoices(sampleItems(intervals, interval, 4));
    } else {
      var chord = chords[Math.floor(Math.random() * chords.length)];
      correct = chord.name;
      chord.semitones.forEach(function (step) {
        tone(frequency(base, step), start, 1.0);
      });
      renderChoices(sampleItems(chords, chord, 4));
    }
    feedback.textContent = "Listen and choose the answer.";
  });
}());
