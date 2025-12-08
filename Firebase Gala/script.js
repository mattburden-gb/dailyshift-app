// -------------------- FIREBASE SETUP --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const appSettings = {
  // This should match the URL shown in the Realtime Database "Data" tab
  databaseURL: "https://gif-gala-e4c3f-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

// Reference to /messages in the database
const messagesInDB = ref(database, "messages");

// -------------------- DOM ELEMENTS --------------------
const rsvpForm = document.getElementById("rsvp-form");
const emailInput = document.getElementById("email");
const confirmationMessage = document.getElementById("confirmation-message");
const showListButton = document.getElementById("show-list");
const messageList = document.querySelector(".messages");
const attendanceDropdown = document.getElementById("attendance");
const messageField = document.getElementById("message-field"); // container
const messageInput = document.getElementById("message");
const body = document.body;

// -------------------- SHOW / HIDE MESSAGE FIELD --------------------
attendanceDropdown.addEventListener("change", (event) => {
  if (event.target.value === "yes") {
    messageField.style.display = "block";
    messageInput.required = true;   // only required when attending
  } else {
    messageField.style.display = "none";
    messageInput.required = false;  // not required when not attending
    messageInput.value = "";        // clear any old text
  }
});

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Stop page refresh

  confirmationMessage.innerHTML = ""; // Clear the old message first

  const attendance = attendanceDropdown.value;
  const messageText = messageInput.value.trim();

  console.log("Attendance value on submit:", attendance);

  if (attendance === "yes") {
    confirmationMessage.innerHTML =
      "🎉 Party on! We look forward to seeing you at the GIF Gala!";
    body.style.backgroundImage =
      'url("https://media.giphy.com/media/l2JHPB58MjfV8W3K0/giphy.gif")';

    if (messageText.length > 0) {
      console.log("Saving message to Firebase:", messageText);
      push(messagesInDB, messageText)
        .then(() => console.log("Message saved successfully."))
        .catch((error) => console.error("Error saving message:", error));
    }

  } else if (attendance === "no") {
    confirmationMessage.innerHTML =
      "😔 We will miss you at the GIF Gala!";
    body.style.backgroundImage =
      'url("https://media.giphy.com/media/JER2en0ZRiGUE/giphy.gif")';
  } else {
    confirmationMessage.innerHTML = "Please select your attendance option.";
  }

  confirmationMessage.style.display = "block";

  attendanceDropdown.value = "";
  messageInput.value = "";
  messageField.style.display = "none";
  messageInput.required = false;
});

// -------------------- TOGGLE MESSAGE LIST VISIBILITY --------------------
showListButton.addEventListener("click", () => {
  if (messageList.style.display === "none" || messageList.style.display === "") {
    messageList.style.display = "flex";
    showListButton.textContent = "Hide Messages";
  } else {
    messageList.style.display = "none";
    showListButton.textContent = "Show Messages";
  }
});

// -------------------- LISTEN FOR UPDATES FROM FIREBASE --------------------
/*
  onValue() sets up a live listener on /messages.
  Every time messages change, this callback runs with a fresh snapshot.
*/
onValue(messagesInDB, (snapshot) => {
  console.log("Firebase snapshot received:", snapshot.val());

  // Clear what’s currently in the list so we don’t duplicate items
  messageList.innerHTML = "";

  if (snapshot.exists()) {
    const messagesObj = snapshot.val();

    // messagesObj looks like { id1: "text 1", id2: "text 2", ... }
    for (const id in messagesObj) {
      const li = document.createElement("li");
      li.textContent = messagesObj[id];
      messageList.appendChild(li);
    }
  } else {
    const li = document.createElement("li");
    li.textContent = "No party messages yet. Be the first to RSVP! 🎉";
    messageList.appendChild(li);
  }
});

