// ---------------------------------------------------------
// 1. IMPORTS & FIREBASE INITIALISATION
// ---------------------------------------------------------
// We import the Firebase modules we need from the CDN.
// - initializeApp: starts Firebase in our app
// - getDatabase: gives us a connection to the Realtime Database
// - ref: creates "pointers" to paths in the database
// - push: adds new data with a unique id
// - onValue: listens for live updates
// - remove: deletes data at a specific path
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js"

// Your Firebase configuration
// (In your real project, you'll usually also have apiKey, authDomain etc.)
// For Realtime Database access, the important field here is databaseURL.
const firebaseConfig = {
  databaseURL: "https://road-wallet-a52ad-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

// Start Firebase
const app = initializeApp(firebaseConfig)

// Get a reference to the Realtime Database service
const database = getDatabase(app)

// Base reference for everything in this app.
// In the database this will look like:
//
// roadWallet
//   ├─ expenses
//   │    ├─ expenseId1: { category, amount, createdAt }
//   │    └─ expenseId2: { ... }
//   └─ travelers
//        ├─ travelerId1: { name, createdAt }
//        └─ travelerId2: { ... }
//
const roadWalletRef = ref(database, "roadWallet")

// Two child references: one for expenses and one for travelers
const expensesRef = ref(database, "roadWallet/expenses")
const travelersRef = ref(database, "roadWallet/travelers")

// ---------------------------------------------------------
// 2. DOM ELEMENTS (HOOKS TO YOUR EXISTING FRONT END)
// ---------------------------------------------------------
// Retrieve elements from the HTML so we can read user input
// and update the page when data changes.
const expenseForm = document.getElementById("expense-form")
const totalExpensesAmountElement = document.getElementById("total-expenses-amount")
const expenseList = document.getElementById("expense-list")

const modal = document.getElementById("travelers-modal")
const openModalButton = document.getElementById("open-modal-button")
const closeButton = document.querySelector(".close-button")

const travelersForm = document.getElementById("travelers-form")
const travelerNameInput = document.getElementById("traveler-name")
const travelersList = document.getElementById("travelers-list")

// ---------------------------------------------------------
// 3. LOCAL STATE (MIRROR OF WHAT'S IN FIREBASE)
// ---------------------------------------------------------
// These arrays hold the current in-memory snapshot of the
// data from Firebase. We never manually edit them directly;
// instead we write to Firebase and then re-sync from there.
let expenses = []     // Each item: { id, category, amount, createdAt }
let travelers = []    // Each item: { id, name, amountOwed, createdAt }

// ---------------------------------------------------------
// 4. MODAL OPEN/CLOSE LOGIC
// ---------------------------------------------------------
// Show the modal when "Add travellers" button is clicked
openModalButton.addEventListener("click", function () {
  modal.classList.add("display-modal")
})

// Hide the modal when the "X" is clicked
closeButton.addEventListener("click", function () {
  modal.classList.remove("display-modal")
})

// Hide the modal if the user clicks outside the modal area
window.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.classList.remove("display-modal")
  }
})

// ---------------------------------------------------------
// 5. FORM HANDLERS
// ---------------------------------------------------------
// When the expense form is submitted, we add a new expense
// to Firebase instead of only keeping it in memory.
expenseForm.addEventListener("submit", function (event) {
  event.preventDefault() // Stop the page from reloading
  handleNewExpense()
})

// When the travellers form is submitted, we add a new traveller
// to Firebase.
travelersForm.addEventListener("submit", function (event) {
  event.preventDefault()
  handleNewTraveler()
})

// ---------------------------------------------------------
// 6. CREATE DATA IN FIREBASE
// ---------------------------------------------------------

// Handle creation of a new expense
function handleNewExpense() {
  // Get the values the user typed into the form
  const category = document.getElementById("expense-category").value
  const amount = parseFloat(document.getElementById("expense-amount").value)

  // Guard: ignore empty or invalid amounts
  if (!category || isNaN(amount) || amount <= 0) {
    return
  }

  // Push a new expense into the "expenses" list in the database.
  // push() automatically generates a unique id for us.
  // The object we pass will be stored as that item's value.
  push(expensesRef, {
    category: category,
    amount: amount,
    createdAt: Date.now()
  })

  // Clear the form so it's ready for the next entry
  expenseForm.reset()
}

// Handle creation of a new traveller
function handleNewTraveler() {
  const travelerName = travelerNameInput.value.trim()

  // Don't create blank travellers
  if (travelerName === "") return

  // Push a new traveller into the "travelers" list in the database.
  push(travelersRef, {
    name: travelerName,
    createdAt: Date.now()
  })

  // Clear the name field for the next traveller
  travelerNameInput.value = ""
}

// ---------------------------------------------------------
// 7. READ/SUBSCRIBE TO FIREBASE DATA (REAL-TIME)
// ---------------------------------------------------------
// These listeners keep the local arrays in sync with the
// database. Whenever anything changes in Firebase, these run
// again and we redraw the UI.

// Listen for changes under "expenses"
onValue(expensesRef, function (snapshot) {
  const newExpenses = []

  // snapshot.forEach loops over each child (each expense)
  snapshot.forEach(function (childSnapshot) {
    const id = childSnapshot.key   // Firebase-generated id
    const data = childSnapshot.val()

    newExpenses.push({
      id: id,
      category: data.category,
      amount: data.amount,
      createdAt: data.createdAt
    })
  })

  // Replace the local array with the latest data
  expenses = newExpenses

  // Recalculate totals and redraw the list
  updateDisplays()
})

// Listen for changes under "travelers"
onValue(travelersRef, function (snapshot) {
  const newTravelers = []

  snapshot.forEach(function (childSnapshot) {
    const id = childSnapshot.key
    const data = childSnapshot.val()

    newTravelers.push({
      id: id,
      name: data.name,
      createdAt: data.createdAt,
      amountOwed: 0 // We'll calculate this based on total expenses
    })
  })

  travelers = newTravelers

  // Recalculate what each traveller owes and redraw lists
  updateDisplays()
})

// ---------------------------------------------------------
// 8. UPDATE ALL DISPLAYS
// ---------------------------------------------------------
// This function is called whenever the data changes (either
// from the user doing something, or from Firebase updates).
function updateDisplays() {
  calculateAmountOwed()
  updateTotalExpensesAmount()
  updateExpenseList()
  updateTravelersList()
}

// ---------------------------------------------------------
// 9. CALCULATE WHAT EACH TRAVELLER OWES
// ---------------------------------------------------------
// We don't store "amount owed" in the database because it's
// derived from expenses + the number of travellers. Instead
// we calculate it each time.
function calculateAmountOwed() {
  if (travelers.length === 0) {
    return
  }

  // Sum up all expense amounts
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Divide by the number of travellers to get each share
  const amountPerTraveler = (totalExpense / travelers.length).toFixed(2)

  // Update each traveller's amountOwed in local memory
  travelers.forEach(traveler => {
    traveler.amountOwed = amountPerTraveler
  })
}

// ---------------------------------------------------------
// 10. UPDATE THE TOTAL EXPENSE DISPLAY
// ---------------------------------------------------------
function updateTotalExpensesAmount() {
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Show something like "$135"
  totalExpensesAmountElement.textContent = "$" + totalExpense.toFixed(2)
}

// ---------------------------------------------------------
// 11. EXPENSE LIST RENDERING & DELETION
// ---------------------------------------------------------
// Redraw the list of expenses on the page
function updateExpenseList() {
  // Clear the existing list
  expenseList.innerHTML = ""

  // Create a <li> for each expense
  expenses.forEach(function (expense) {
    addExpenseToList(expense)
  })
}

// Add a single expense item to the visual list
function addExpenseToList(expense) {
  const expenseItem = document.createElement("li")

  // Example text: "Food: $20.00"
  expenseItem.textContent = `${expense.category}: $${expense.amount.toFixed(2)}`

  // Add a delete button for this expense, wired to its Firebase id
  const deleteIcon = createDeleteButton(expense.id, deleteExpense)

  expenseItem.appendChild(deleteIcon)
  expenseList.appendChild(expenseItem)
}

// Delete an expense from Firebase (and therefore from the UI)
// We don't touch the local array here – the onValue listener
// above will fire again and update it for us.
function deleteExpense(expenseId) {
  const expenseToDeleteRef = ref(database, `roadWallet/expenses/${expenseId}`)
  remove(expenseToDeleteRef)
}

// ---------------------------------------------------------
// 12. TRAVELLER LIST RENDERING & REMOVAL
// ---------------------------------------------------------
// Redraw the list of travellers
function updateTravelersList() {
  travelersList.innerHTML = ""

  travelers.forEach(function (traveler) {
    addTravelerToList(traveler)
  })
}

// Add a single traveller entry to the UI
function addTravelerToList(traveler) {
  const travelerItem = document.createElement("div")
  travelerItem.classList.add("traveler-item")

  // Example text: "Alice: $45.00"
  travelerItem.textContent = `${traveler.name}: $${traveler.amountOwed}`

  // Add a delete button for this traveller, wired to its Firebase id
  const removeButton = createDeleteButton(traveler.id, removeTraveler)

  travelerItem.appendChild(removeButton)
  travelersList.appendChild(travelerItem)
}

// Remove a traveller from Firebase.
// Again, the onValue(travelersRef) listener will pick up the change
// and refresh the local state + UI.
function removeTraveler(travelerId) {
  const travelerToDeleteRef = ref(database, `roadWallet/travelers/${travelerId}`)
  remove(travelerToDeleteRef)
}

// ---------------------------------------------------------
// 13. SHARED HELPER: CREATE A DELETE BUTTON
// ---------------------------------------------------------
// This function creates a reusable delete button used both
// for expenses and travellers.
function createDeleteButton(id, deleteFunction) {
  const button = document.createElement("button")

  // Show a trash icon if you're using Font Awesome in your HTML,
  // otherwise this will just show an empty box.
  button.innerHTML = "<i class='fas fa-trash-alt'></i>"

  // When clicked, we call the function passed in (deleteExpense
  // or removeTraveler) with the correct Firebase id.
  button.addEventListener("click", function () {
    deleteFunction(id)
  })

  return button
}
