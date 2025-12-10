// -------------------- FIREBASE SETUP --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { getDatabase, ref, push, get } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

// Firebase configuration (same as before)
const firebaseConfig = {
  databaseURL:
    "https://kudosdelight-792ca-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// -------------------- DOM ELEMENTS --------------------
const complimentDisplay = document.getElementById("compliment-display");

const courageButton = document.getElementById("courageButton");
const positivityButton = document.getElementById("positivityButton");
const appreciationButton = document.getElementById("appreciationButton");
const gratitudeButton = document.getElementById("gratitudeButton");

const gratitudePanel = document.getElementById("gratitudePanel");
const gratitudeInput1 = document.getElementById("gratitudeInput1");
const gratitudeInput2 = document.getElementById("gratitudeInput2");
const gratitudeInput3 = document.getElementById("gratitudeInput3");
const saveGratitudeButton = document.getElementById("saveGratitudeButton");
const gratitudeReminderButton = document.getElementById(
  "gratitudeReminderButton"
);

const successMessage = document.getElementById("successMessage");

// -------------------- VIEW SWITCHING --------------------

// Get view containers
const homeView = document.getElementById("homeView");
const gratitudeView = document.getElementById("gratitudeView");
const boostedView = document.getElementById("boostedView");

// Get navigation buttons
const goToGratitudeButton = document.getElementById("goToGratitudeButton");
const goToBoostedButton = document.getElementById("goToBoostedButton");
const backFromGratitudeButton = document.getElementById("backFromGratitudeButton");
const backFromBoostedButton = document.getElementById("backFromBoostedButton");

// Helper to show a single view
function showView(viewId) {
  console.log("showView called with:", viewId);

  const views = document.querySelectorAll(".view");
  views.forEach((v) => v.classList.add("hidden"));

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove("hidden");
  } else {
    console.warn("No view found with id:", viewId);
  }
}

// Hook up navigation only if the elements exist
if (goToGratitudeButton) {
  goToGratitudeButton.addEventListener("click", () => {
    console.log("Be grateful clicked");
    showView("gratitudeView");
  });
} else {
  console.warn("goToGratitudeButton not found");
}

if (goToBoostedButton) {
  goToBoostedButton.addEventListener("click", () => {
    console.log("Be boosted clicked");
    showView("boostedView");
  });
} else {
  console.warn("goToBoostedButton not found");
}

if (backFromGratitudeButton) {
  backFromGratitudeButton.addEventListener("click", () => {
    console.log("Back from gratitude clicked");
    showView("homeView");
  });
} else {
  console.warn("backFromGratitudeButton not found");
}

if (backFromBoostedButton) {
  backFromBoostedButton.addEventListener("click", () => {
    console.log("Back from boosted clicked");
    showView("homeView");
  });
} else {
  console.warn("backFromBoostedButton not found");
}

// Make sure we land on home when the app loads
showView("homeView");

// -------------------- HELPERS --------------------

// Try multiple possible paths for a category so we don't care exactly
// how the JSON ended up being imported.
async function getCategorySnapshot(category) {
  const possiblePaths = [
    `statements/${category}`,
    category,
    `statements/statements/${category}`,
  ];

  for (const path of possiblePaths) {
    const dbRef = ref(database, path);
    console.log(`[DailyShift] Trying path: ${path}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      console.log(`[DailyShift] Found data at: ${path}`);
      return snapshot;
    }
  }

  console.warn(
    `[DailyShift] No data found for category "${category}" at any known path.`
  );
  return null;
}

async function showRandomForCategory(category, emptyMessage) {
  try {
    const snapshot = await getCategorySnapshot(category);

    if (!snapshot || !snapshot.exists()) {
      complimentDisplay.textContent = emptyMessage;
      return;
    }

    const values = Object.values(snapshot.val() || {});
    console.log(`[DailyShift] Values for ${category}:`, values);

    if (!values.length) {
      complimentDisplay.textContent = emptyMessage;
      return;
    }

    const randomIndex = Math.floor(Math.random() * values.length);
    const randomStatement = values[randomIndex];
    complimentDisplay.textContent = randomStatement;
    complimentDisplay.classList.remove("fade-in");
    void complimentDisplay.offsetWidth; // magic reflow to restart animation
    complimentDisplay.classList.add("fade-in");

  } catch (error) {
    console.error("Error fetching statements:", error);
    complimentDisplay.textContent =
      "Oops! We couldn't fetch anything right now. Please try again.";
  }
}

// For gratitude we will *save* to one clear path,
// but we can also *read* flexibly using getCategorySnapshot("gratitude")
const gratitudeWriteRef = ref(database, "statements/gratitude");

// Hide the gratitude panel + clear inputs
function resetGratitudePanel() {
  gratitudePanel.classList.add("hidden");
  gratitudeInput1.value = "";
  gratitudeInput2.value = "";
  gratitudeInput3.value = "";
}

// Show success message for 3 seconds
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.remove("hidden");

  setTimeout(() => {
    successMessage.classList.add("hidden");
  }, 3000);
}

// -------------------- BUTTON BEHAVIOUR --------------------

// Courage, Positivity, Appreciation: generate affirmations
courageButton.addEventListener("click", () => {
  resetGratitudePanel();
  showRandomForCategory(
    "courage",
    "No courage statements yet. Add some when you have a moment."
  );
});

positivityButton.addEventListener("click", () => {
  resetGratitudePanel();
  showRandomForCategory(
    "positivity",
    "No positivity statements yet. Add some when you have a moment."
  );
});

appreciationButton.addEventListener("click", () => {
  resetGratitudePanel();
  showRandomForCategory(
    "appreciation",
    "No appreciation statements yet. Add some when you have a moment."
  );
});

// Gratitude: open/close panel
gratitudeButton.addEventListener("click", () => {
  gratitudePanel.classList.toggle("hidden");
  successMessage.classList.add("hidden");
});

// Save 3 gratitude statements
saveGratitudeButton.addEventListener("click", async () => {
  const g1 = gratitudeInput1.value.trim();
  const g2 = gratitudeInput2.value.trim();
  const g3 = gratitudeInput3.value.trim();

  if (!g1 || !g2 || !g3) {
    alert("Please add three things you're grateful for.");
    return;
  }
if (goToGratitudeButton) {
  goToGratitudeButton.addEventListener("click", () => {
    showView("gratitudeView");
  });
}

if (goToBoostedButton) {
  goToBoostedButton.addEventListener("click", () => {
    showView("boostedView");
  });
}

if (backFromGratitudeButton) {
  backFromGratitudeButton.addEventListener("click", () => {
    showView("homeView");
  });
}

if (backFromBoostedButton) {
  backFromBoostedButton.addEventListener("click", () => {
    showView("homeView");
  });
}

  try {
    await Promise.all([
      push(gratitudeWriteRef, g1),
      push(gratitudeWriteRef, g2),
      push(gratitudeWriteRef, g3),
    ]);

    resetGratitudePanel();
    showSuccess("Your gratitude has been saved. We'll remind you later 💙");
  } catch (error) {
    console.error("Error saving gratitude statements:", error);
    alert("Oops! Something went wrong saving your gratitude.");
  }
});

// Gratitude Reminder: pull a random gratitude statement from Firebase
gratitudeReminderButton.addEventListener("click", () => {
  showRandomForCategory(
    "gratitude",
    "No gratitude statements saved yet. Add three to get started."
  );
});

