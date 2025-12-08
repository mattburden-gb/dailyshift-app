// === Get references to things on the page ===

// The Start Game button
const startButton = document.getElementById('start-button');

// Where we show the score number
const scoreDisplay = document.getElementById('score-value');

// Where we show the time remaining (just the number)
const timeDisplay = document.getElementById('time-remaining');

// Where we show the final message when the game ends
const finalMessage = document.getElementById('final-message');

// Label that contains "Time left: X seconds"
const timerLabel = document.getElementById('timer-label');

// All the "holes" on the board (each one contains an image)
const holes = document.querySelectorAll('.hole');

// Bomp sound effect
const bompSound = document.getElementById('bomp-sound');
const endSound = document.getElementById('end-sound');
const highSound = document.getElementById('high-sound');

function playBomp() {
  console.log("Attempting to play bomp sound", bompSound);

  if (!bompSound) {
    console.warn("bompSound element not found in the DOM.");
    return;
  }

  bompSound.currentTime = 0;     // rewind to start each time
  bompSound.volume = 1;          // ensure full volume

  const playPromise = bompSound.play();

  if (playPromise && playPromise.catch) {
    playPromise.catch(err => {
      console.error("Error playing bomp sound:", err);
    });
  }
}

function playEndGameSound() {
  let soundToPlay;

  if (score > 10) {
    soundToPlay = highSound;
    console.log("Playing HIGH score end sound");
  } else {
    soundToPlay = endSound;
    console.log("Playing NORMAL end sound");
  }

  if (!soundToPlay) return;

  soundToPlay.currentTime = 0;
  soundToPlay.volume = 1;

  const playPromise = soundToPlay.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(err => console.error("End sound error:", err));
  }
}

// === Game state variables ===

let score = 0;                 // current score
let timeLeft = 30;             // seconds remaining in the countdown
let gameActive = false;        // is the game currently running?

let countdownInterval = null;  // ID for the 1-second timer
let faceTimeout = null;        // ID for the pop-in / pop-out timeouts


// === Helper: pick a random hole ===
function getRandomHole() {
  const index = Math.floor(Math.random() * holes.length);
  return holes[index];
}


// === Show a face in a random hole, then hide it again ===
function popUpFace() {
  // If the game is not active (e.g. time is up), don't pop any more faces
  if (!gameActive) return;

  // First, make sure no other holes are "active" or "clicked"
  holes.forEach(hole => {
    hole.classList.remove('active');
    const img = hole.querySelector('.target-image');
    img.classList.remove('clicked');
  });

  // Pick a random hole and activate it
  const hole = getRandomHole();
  hole.classList.add('active');  // CSS makes the image scale to 1 (visible)

  // How long should the face stay visible? (random between 400–900 ms)
  const visibleTime = 400 + Math.random() * 500;

  // After that time, hide the face and queue up the next one
  faceTimeout = setTimeout(() => {
    const img = hole.querySelector('.target-image');
    hole.classList.remove('active');  // hide this face
    img.classList.remove('clicked');  // make sure border is cleared

    // Add a small random delay before the next face appears
    const delayBeforeNext = 100 + Math.random() * 300;

    faceTimeout = setTimeout(() => {
      popUpFace(); // show another random face
    }, delayBeforeNext);
  }, visibleTime);
}


// === Start the countdown timer ===
function startCountdown() {
  // Clear any previous timer just in case
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      // Time's up – stop everything
      endGame();
    }
  }, 1000); // run every 1000 ms (1 second)
}


// === Handle clicking on a face ===
function handleFaceClick(event) {
  // If the game isn't running, ignore clicks
  if (!gameActive) return;

  const img = event.currentTarget;         // the clicked image
  const hole = img.parentElement;          // its parent .hole

  // Only count the click if the hole is currently active (face is up)
  if (!hole.classList.contains('active')) return;

  // Add red border
  img.classList.add('clicked');

  // Play bomp sound
    playBomp();

  // Remove border after a short flash
  setTimeout(() => {
    img.classList.remove('clicked');
  }, 300);

  // Increase score and update the display
  score++;
  scoreDisplay.textContent = score;

  // Hide the face after a successful hit
  hole.classList.remove('active');
}


// === Decide on a fun, witty message based on the final score ===
function getFinalMessage(score) {
  if (score === 0) {
    return "Ouch. He's laughing at you! 🤦🏻";
  } else if (score <= 5) {
    return "Not great. You're letting him off the hook! 👶";
  } else if (score <= 10) {
    return "Solid effort! The faces never saw it coming. 😎";
  } else if (score <= 20) {
    return "OBB pro! Pummel that Bell End! 💪🏼";
  } else {
    return "Legendary! You Bashed that Big Baby! 🍊";
  }
}


// === Reset and start a new game ===
function startGame() {
  // Stop any old timers so we don't have multiple running
  clearInterval(countdownInterval);
  clearTimeout(faceTimeout);

  // Reset game state
  score = 0;
  timeLeft = 30;
  gameActive = true;

  // Reset what the player sees
  scoreDisplay.textContent = score;          // show "0"
  timeDisplay.textContent = timeLeft;        // show "30"
  startButton.textContent = "Start Game";    // ensure button label is correct

  // Show the timer label again, hide the final message
  timerLabel.classList.remove('hidden');     // "Time left: 30 seconds" visible
  finalMessage.classList.add('hidden');      // hide the message
  finalMessage.textContent = "";             // clear old text

  // Make sure no faces or borders are visible at the start
  holes.forEach(hole => {
    hole.classList.remove('active');
    const img = hole.querySelector('.target-image');
    img.classList.remove('clicked');
  });

  // Disable the start button while the game is running (optional)
  startButton.disabled = true;

  // Start the countdown and the popping faces
  startCountdown();
  popUpFace();
}


// === End the game when the timer reaches zero ===

  // Play the end-game sound
function endGame() {
  gameActive = false;

  // Play correct sound based on score
  playEndGameSound();

  clearInterval(countdownInterval);
  clearTimeout(faceTimeout);

  holes.forEach(hole => {
    hole.classList.remove('active');
    const img = hole.querySelector('.target-image');
    img.classList.remove('clicked');
  });

  const messageText = `Game over! Your final score is ${score}. ${getFinalMessage(score)}`;

  timerLabel.classList.add('hidden');
  finalMessage.classList.remove('hidden');
  finalMessage.textContent = messageText;

  startButton.disabled = false;
  startButton.textContent = "Start Game";
}

// === Set up event listeners ===

// Start button: starts (or restarts) the game
startButton.addEventListener('click', startGame);

// Each image: listen for clicks to increase the score
holes.forEach(hole => {
  const img = hole.querySelector('.target-image');
  img.addEventListener('click', handleFaceClick);
});


