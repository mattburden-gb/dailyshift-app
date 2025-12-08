// index.js

// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,            // write objects
  onValue,        // real-time listener
  runTransaction, // safe increments/decrements
  get,            // one-time read (to load user's previous vote)
  remove          // delete data (used for "Delete poll")
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

/* ------------------------------------------------------------------
   1. CONNECT TO YOUR FIREBASE REALTIME DATABASE
   ------------------------------------------------------------------ */

const firebaseConfig = {
  databaseURL:
    "https://lunch-break-poll-42138-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialise Firebase and grab the database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// /places holds all the lunch places
const placesRef = ref(database, "places");
// /votes holds each user's selected place
const votesRef = ref(database, "votes");


/* ------------------------------------------------------------------
   2. DOM ELEMENTS
   ------------------------------------------------------------------ */

const placeForm = document.getElementById("placeForm");
const placeInput = document.getElementById("placeInput");
const placesList = document.getElementById("placesList");
const leadingPlaceDisplay = document.getElementById("leadingPlace");
const deletePollButton = document.getElementById("deletePollButton");

// Latest snapshot of places so the form can check for duplicates
let latestPlaces = {};

// Track the current user's active vote (which placeKey they chose)
let currentUserVoteKey = null;


/* ------------------------------------------------------------------
   3. LIGHTWEIGHT “USER” HANDLING (PER BROWSER)
   ------------------------------------------------------------------ */

/**
 * Create or retrieve a simple user ID stored in localStorage.
 * This is NOT secure auth – it just lets us treat each browser
 * as a “user” so we can limit to one vote per browser.
 */
function getOrCreateUserId() {
  const storageKey = "lunchVoteUserId";
  let id = localStorage.getItem(storageKey);

  if (!id) {
    // Generate a simple random ID like "user_xkj29asf"
    id = "user_" + Math.random().toString(36).slice(2);
    localStorage.setItem(storageKey, id);
  }
  return id;
}

const currentUserId = getOrCreateUserId();
// /votes/<userId> will store which placeKey this user voted for
const userVoteRef = ref(database, `votes/${currentUserId}`);

// When the app starts, load this user's previous vote (if any)
get(userVoteRef)
  .then((snapshot) => {
    if (snapshot.exists()) {
      const storedKey = snapshot.val();
      // Only accept it if it's a non-empty string and not "undefined"
      if (typeof storedKey === "string" && storedKey && storedKey !== "undefined") {
        currentUserVoteKey = storedKey; // e.g. "4_pines"
      } else {
        currentUserVoteKey = null;
      }
    }
  })
  .catch((err) => {
    console.error("Error loading user vote:", err);
  });


/* ------------------------------------------------------------------
   4. HELPERS
   ------------------------------------------------------------------ */

/**
 * Turn a place name into a safe key we can use in the database path.
 * Example: "4 Pines" -> "4_pines"
 */
function makePlaceKey(name) {
  if (!name) return null;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  // Guard against empty strings or literal "undefined"
  if (!key || key === "undefined") return null;
  return key;
}


/* ------------------------------------------------------------------
   5. ADD NEW PLACE (NO DUPLICATES BY NAME)
   ------------------------------------------------------------------ */

placeForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop page reload

  const newPlaceName = placeInput.value.trim();
  if (newPlaceName === "") return;

  // Build a safe key such as "4_pines"
  const placeKey = makePlaceKey(newPlaceName);

  // Safety guard — never write to /places/undefined or empty keys
  if (!placeKey) {
    console.warn("Invalid place name, skipping");
    placeInput.value = "";
    return;
  }

  // If we already have this key in the latest data, don't add it again
  if (latestPlaces && latestPlaces[placeKey]) {
    alert("That place is already in the list!");
    placeInput.value = "";
    return;
  }

  const placeRef = ref(database, `places/${placeKey}`);

  // Create this place with 0 initial votes
  set(placeRef, {
    name: newPlaceName,
    votes: 0
  });

  placeInput.value = "";
});


/* ------------------------------------------------------------------
   6. REAL-TIME LISTENER: DISPLAY PLACES + HANDLE VOTES
   ------------------------------------------------------------------ */

onValue(placesRef, function (snapshot) {
  const placesData = snapshot.val();

  // Cache latest places for the “no duplicates” check in the form
  latestPlaces = placesData || {};

  // Clear list in the UI
  placesList.innerHTML = "";

  if (!placesData) {
    leadingPlaceDisplay.textContent = "No places added yet.";
    // No places = no poll → hide the delete button (if it exists)
    if (deletePollButton) {
      deletePollButton.style.display = "none";
    }
    return;
  }

  let topPlace = null;
  let placeCount = 0; // track how many valid places we actually render

  // Loop over each place: key is our slug (e.g. "4_pines")
  for (let key in placesData) {
    const place = placesData[key];

    // Defensive check: skip any broken or partial entries
    if (!place || typeof place.name !== "string") {
      console.warn("Skipping invalid place entry at key:", key, place);
      continue;
    }

    placeCount++;

    const item = document.createElement("div");
    item.className = "place-item";
    item.textContent = `${place.name} — Votes: ${place.votes ?? 0}`;
    item.style.cursor = "pointer";

    // Visually highlight the place the user has voted for
    if (key === currentUserVoteKey) {
      item.classList.add("place-item-selected");
    }

    /*
      Voting logic:
      - User can only have ONE active vote.
      - Clicking a new place moves their vote:
          old place: votes - 1
          new place: votes + 1
      - Clicking the same place again does nothing.
    */
    item.addEventListener("click", function () {
      const newKey = key;
      const oldKey = currentUserVoteKey;

      // Guard: never use invalid keys
      if (!newKey || newKey === "undefined") return;

      // If they click the same place they already voted for, ignore
      if (newKey === oldKey) {
        return;
      }

      // 1) Increment votes for the NEW choice
      const newVotesRef = ref(database, `places/${newKey}/votes`);
      runTransaction(newVotesRef, function (currentVotes) {
        if (currentVotes === null || isNaN(currentVotes)) {
          return 1; // start from 1 if no value
        }
        return currentVotes + 1;
      });

      // 2) If there was an OLD choice, decrement its votes
      if (oldKey && oldKey !== "undefined") {
        const oldVotesRef = ref(database, `places/${oldKey}/votes`);
        runTransaction(oldVotesRef, (currentVotes) => {
          if (currentVotes === null || isNaN(currentVotes)) return 0;
          return Math.max(currentVotes - 1, 0); // never go below 0
        });
      }

      // 3) Update this user's vote record in the database
      set(userVoteRef, newKey);

      // 4) Update local state so UI highlights instantly
      currentUserVoteKey = newKey;
    });

    placesList.appendChild(item);

    // Track the leading place
    const votes = typeof place.votes === "number" ? place.votes : 0;
    if (!topPlace || votes > topPlace.votes) {
      topPlace = { name: place.name, votes };
    }
  }

  if (topPlace && placeCount > 0) {
    leadingPlaceDisplay.textContent =
      `Leading: ${topPlace.name} (${topPlace.votes} votes)`;
  } else {
    leadingPlaceDisplay.textContent = "No places added yet.";
  }

  // Show the delete button only if we have at least one valid place
  if (deletePollButton) {
    deletePollButton.style.display =
      placeCount > 0 ? "inline-block" : "none";
  }
});


/* ------------------------------------------------------------------
   7. DELETE POLL BUTTON
   ------------------------------------------------------------------ */

if (deletePollButton) {
  deletePollButton.addEventListener("click", function () {
    // Double-check the user really wants to delete everything
    const confirmed = window.confirm(
      "Delete this poll and all votes? This cannot be undone."
    );
    if (!confirmed) return;

    /*
      We remove:
      - all places under /places
      - all user votes under /votes

      The onValue(placesRef, ...) listener will then fire with
      no data and reset the UI automatically.
    */
    Promise.all([
      remove(placesRef),
      remove(votesRef)
    ])
      .then(() => {
        // Clear local state
        latestPlaces = {};
        currentUserVoteKey = null;

        // Forget this browser's user ID so next vote starts fresh
        localStorage.removeItem("lunchVoteUserId");

        // Optional: reload page to fully reset UI
        window.location.reload();
      })
      .catch((err) => {
        console.error("Error deleting poll:", err);
        alert("Something went wrong while deleting the poll.");
      });
  });
}



