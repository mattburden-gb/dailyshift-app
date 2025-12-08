// Create an empty array to store all participant names
let participants = [];

// Get a reference to the form element so we can listen for submissions
const entryForm = document.getElementById('entry-form');
// Get a reference to the text input where the user types their name
const nameInput = document.getElementById('name-input');
// Get a reference to the list element where we will show all participants
const participantList = document.getElementById('participant-list');
// Get a reference to the button that will draw a random winner
const drawButton = document.getElementById('draw-button');
// Get a reference to the paragraph where we will show the winner message
const winnerMessage = document.getElementById('winner-message');

// Call a function now to update the draw button state (enabled/disabled)
updateDrawButtonState();

// Add an event listener that will run when the entry form is submitted
entryForm.addEventListener('submit', function(event) {
  // Stop the form from refreshing the page (the default behaviour)
  event.preventDefault();

  // Read the value (text) that the user typed into the name input
  const enteredName = nameInput.value.trim();

  // Check if the user actually typed something (not an empty string)
  if (enteredName !== '') {
    // Add the entered name to our participants array
    participants.push(enteredName);
    // Call a function to refresh the visible list of participants on the page
    renderParticipantList();
    // Call a function to update the winner message back to the default text
    resetWinnerMessage();
    // Call a function to enable the draw button if we now have participants
    updateDrawButtonState();
    // Clear the text input so it is ready for another name
    nameInput.value = '';
    // Put the typing cursor back into the input box for convenience
    nameInput.focus();
  }
});

// Add an event listener that will run when the draw button is clicked
drawButton.addEventListener('click', function() {
  // Check if there is at least one participant before drawing
  if (participants.length > 0) {
    // Generate a random number between 0 and (number of participants - 1)
    const randomIndex = Math.floor(Math.random() * participants.length);
    // Use the random number to select a winner from the participants array
    const winnerName = participants[randomIndex];
    // Build a message string that includes the winner's name and emojis
    const message = `🍰🎉 The winner is: ${winnerName}! 🎉🍰`;
    // Display the winner message in the winner message paragraph
    winnerMessage.textContent = message;
  }
});

// Define a function to show all participant names in the list element
function renderParticipantList() {
  // Clear any existing content inside the participant list
  participantList.innerHTML = '';

  // Loop through each name in the participants array
  participants.forEach(function(name) {
    // Create a new list item element for this participant
    const listItem = document.createElement('li');
    // Set the text of the list item to the participant's name
    listItem.textContent = name;
    // Add the new list item to the participant list on the page
    participantList.appendChild(listItem);
  });
}

// Define a function to reset the winner message to a default state
function resetWinnerMessage() {
  // Set the winner message text back to a helpful default message
  winnerMessage.textContent = 'No winner yet. Click "Draw Winner" when you\'re ready!';
}

// Define a function to enable or disable the draw button based on participants
function updateDrawButtonState() {
  // Check if there is at least one name in the participants array
  if (participants.length > 0) {
    // If we have participants, allow the draw button to be clicked
    drawButton.disabled = false;
  } else {
    // If there are no participants, disable the draw button
    drawButton.disabled = true;
  }
}
