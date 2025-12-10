// -------------------- FIREBASE SETUP --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

// Firebase configuration (same as before)
const firebaseConfig = {
  databaseURL:
    "https://kudosdelight-792ca-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// -------------------- DOM: STATEMENT DISPLAY & CATEGORY BUTTONS --------------------
const complimentDisplay = document.getElementById("compliment-display");

const courageButton = document.getElementById("courageButton");
const positivityButton = document.getElementById("positivityButton");
const appreciationButton = document.getElementById("appreciationButton");
const gratitudeButton = document.getElementById("gratitudeButton");

// -------------------- DOM: VIEWS & NAVIGATION --------------------
const homeView = document.getElementById("homeView");
const gratitudeView = document.getElementById("gratitudeView");
const boostedView = document.getElementById("boostedView");

const goToGratitudeButton = document.getElementById("goToGratitudeButton");
const goToBoostedButton = document.getElementById("goToBoostedButton");
const backFromGratitudeButton = document.getElementById("backFromGratitudeButton");
const backFromBoostedButton = document.getElementById("backFromBoostedButton");

// -------------------- VIEW SWITCHING --------------------
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

// Ensure we land on the home screen on load
showView("homeView");

// -------------------- GRATITUDE VIEW UI BEHAVIOUR --------------------
const startGratitudeButton = document.getElementById("startGratitudeButton");
const remindGratitudeButton = document.getElementById("remindGratitudeButton");

const gratitudeInputSection = document.getElementById("gratitudeInputSection");
const gratitudeRemindSection = document.getElementById("gratitudeRemindSection");

const gratitude1Input = document.getElementById("gratitude1");
const gratitude2Input = document.getElementById("gratitude2");
const gratitude3Input = document.getElementById("gratitude3");
const gratitudeSaveBtn = document.getElementById("saveGratitudeButton");
const gratitudeSaveMessage = document.getElementById("gratitudeSaveMessage");

function showGratitudePanel(panel) {
  if (!gratitudeInputSection || !gratitudeRemindSection) return;

  gratitudeInputSection.classList.add("hidden");
  gratitudeRemindSection.classList.add("hidden");

  if (panel === "input") {
    gratitudeInputSection.classList.remove("hidden");
  } else if (panel === "remind") {
    gratitudeRemindSection.classList.remove("hidden");
  }
}

if (startGratitudeButton) {
  startGratitudeButton.addEventListener("click", () => {
    showGratitudePanel("input");
  });
}

if (remindGratitudeButton) {
  remindGratitudeButton.addEventListener("click", () => {
    showGratitudePanel("remind");
  });
}

// For now, just validate and show a local confirmation.
// We'll wire this to Firebase in the next phase.
if (gratitudeSaveBtn) {
  gratitudeSaveBtn.addEventListener("click", () => {
    const g1 = gratitude1Input?.value.trim();
    const g2 = gratitude2Input?.value.trim();
    const g3 = gratitude3Input?.value.trim();

    if (!g1 && !g2 && !g3) {
      if (gratitudeSaveMessage) {
        gratitudeSaveMessage.textContent =
          "Add at least one gratitude before saving.";
        gratitudeSaveMessage.classList.remove("hidden");
      }
      return;
    }

    if (gratitudeSaveMessage) {
      gratitudeSaveMessage.textContent =
        "Gratitude saved (locally for now) – we’ll connect this to your journal soon.";
      gratitudeSaveMessage.classList.remove("hidden");
    }

    // Reset the fields
    if (gratitude1Input) gratitude1Input.value = "";
    if (gratitude2Input) gratitude2Input.value = "";
    if (gratitude3Input) gratitude3Input.value = "";
  });
}

// -------------------- FIREBASE HELPERS FOR STATEMENTS --------------------
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
    void complimentDisplay.offsetWidth; // restart animation
    complimentDisplay.classList.add("fade-in");
  } catch (error) {
    console.error("Error fetching statements:", error);
    complimentDisplay.textContent =
      "Oops! We couldn't fetch anything right now. Please try again.";
  }
}

// -------------------- BUTTON BEHAVIOUR (BOOSTED VIEW) --------------------

// Each category button just generates a random statement.
// We removed the old inline gratitude panel logic.

if (courageButton) {
  courageButton.addEventListener("click", () => {
    showRandomForCategory(
      "courage",
      "No courage statements yet. Add some when you have a moment."
    );
  });
}

if (positivityButton) {
  positivityButton.addEventListener("click", () => {
    showRandomForCategory(
      "positivity",
      "No positivity statements yet. Add some when you have a moment."
    );
  });
}

if (appreciationButton) {
  appreciationButton.addEventListener("click", () => {
    showRandomForCategory(
      "appreciation",
      "No appreciation statements yet. Add some when you have a moment."
    );
  });
}

// Treat gratitudeButton as a fourth boost category for now.
if (gratitudeButton) {
  gratitudeButton.addEventListener("click", () => {
    showRandomForCategory(
      "gratitude",
      "No gratitude statements yet. Add some when you have a moment."
    );
  });
}


