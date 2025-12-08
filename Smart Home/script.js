document.addEventListener("DOMContentLoaded", function () {
  /* ---------------- TEMPERATURE LOGIC ---------------- */

  let currentTemp = 78;

  const tempDisplay = document.getElementById("current-temp");
  const coolerBtn = document.getElementById("temp-down-btn");
  const warmerBtn = document.getElementById("temp-up-btn");

  if (tempDisplay && coolerBtn && warmerBtn) {
    function updateTemperature() {
      tempDisplay.textContent = `${currentTemp}°F`;
    }

    updateTemperature();

    coolerBtn.addEventListener("click", function () {
      currentTemp--;
      updateTemperature();
    });

    warmerBtn.addEventListener("click", function () {
      currentTemp++;
      updateTemperature();
    });
  }

  /* ---------------- MUSIC LOGIC ---------------- */

  // Silly / funny song names
  const songs = [
    "Boop the Snoot Symphony",
    "Disco Nap in the Dog Bed",
    "Cat on Keyboard Concerto",
    "Wi-Fi Went Down Blues",
    "Lo-Fi Snacks to Study To",
    "Midnight Fridge Raid Remix",
    "I Left the Laundry in Again",
    "Oops, All Notifications",
  ];

  let currentSongIndex = null;
  let isPlaying = false;

  const songDisplay = document.getElementById("current-song");
  const playBtn = document.getElementById("music-play-btn");
  const playIcon = document.getElementById("play-icon");
  const stopBtn = document.getElementById("music-stop-btn");
  const nextBtn = document.getElementById("music-next-btn");

  if (songDisplay && playBtn && playIcon && stopBtn && nextBtn) {
    // Helper: choose a random song index different from current
    function getRandomDifferentIndex() {
      if (songs.length <= 1) return 0;
      let idx;
      do {
        idx = Math.floor(Math.random() * songs.length);
      } while (idx === currentSongIndex);
      return idx;
    }

    // Helper: set the song and update the display text
    function setSong(index) {
      currentSongIndex = index;
      const title = songs[index];
      songDisplay.textContent = `Now playing: ${title}`;
    }

    // Helper: update button look between Play and Pause
    function setPlayingState(playing) {
      isPlaying = playing;
      if (playing) {
        playIcon.className = "fa-solid fa-pause";
        playBtn.querySelector(".btn-label").textContent = "Pause";
      } else {
        playIcon.className = "fa-solid fa-play";
        playBtn.querySelector(".btn-label").textContent = "Play";
      }
    }

    // Play / Pause toggle
    playBtn.addEventListener("click", function () {
      if (!isPlaying) {
        // If we don't have a song yet, pick a random one
        if (currentSongIndex === null) {
          setSong(getRandomDifferentIndex());
        } else {
          // If resuming, just say we're playing the same song
          songDisplay.textContent = `Now playing: ${songs[currentSongIndex]}`;
        }
        setPlayingState(true);
      } else {
        // Pause the current song
        setPlayingState(false);
        if (currentSongIndex !== null) {
          songDisplay.textContent = `Paused: ${songs[currentSongIndex]}`;
        } else {
          songDisplay.textContent = "Paused.";
        }
      }
    });

    // Stop button: stop playback and clear song
    stopBtn.addEventListener("click", function () {
      setPlayingState(false);
      currentSongIndex = null;
      songDisplay.textContent = "Playback stopped.";
    });

    // Next button: pick a different random funny song and start playing
    nextBtn.addEventListener("click", function () {
      const newIndex = getRandomDifferentIndex();
      setSong(newIndex);
      setPlayingState(true);
    });
  }

  /* ---------------- SERVICE WORKER REGISTRATION ---------------- */

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service worker registered");
      })
      .catch(err => {
        console.error("Service worker registration failed:", err);
      });
  }

  /* ---------------- BUTTON ACTIVE STATES (PRESS + GLOW) ---------------- */
  const controlButtons = document.querySelectorAll(".control-button");

  controlButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // 1) ORANGE PRESS FLASH (same for all sections)
      btn.classList.add("is-pressed");
      setTimeout(() => {
        btn.classList.remove("is-pressed");
      }, 150); // 150ms = quick tap feedback

      // 2) GLOW BEHAVIOUR (different for Temperature vs Music)
      const section = btn.closest("section");
      if (!section) return;

      const isTemperature = section.id === "temperature-section";

      // Remove any existing glow in that section first
      section.querySelectorAll(".control-button").forEach(b => {
        b.classList.remove("is-active");
      });

      // Add glow to the clicked button
      btn.classList.add("is-active");

      if (isTemperature) {
        // Temperature: auto-remove glow after 2 seconds
        setTimeout(() => {
          btn.classList.remove("is-active");
        }, 2000);
      }
      // Music: do nothing else → glow stays until another music button is clicked
   });
  });
});