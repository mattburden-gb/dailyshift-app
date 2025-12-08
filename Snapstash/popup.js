// Run our code after the popup's HTML has finished loading
document.addEventListener("DOMContentLoaded", () => {
  // --- Grab references to key DOM elements ---
  const categorySelect = document.getElementById("category-select"); // dropdown
  const saveBtn = document.getElementById("save-btn");               // save button
  const itemPreview = document.getElementById("item-preview");       // preview text

  /*
    We'll group items by category when displaying, but they are all stored
    in ONE array in chrome.storage.sync called "shoppingList".

    These IDs match the <ul> elements in popup.html.
  */
  const categoryToListId = {
    Whisky: "list-whisky",
    Lego: "list-lego",
    Clothes: "list-clothes",
    Shoes: "list-shoes",
    Electronics: "list-electronics",
    Pets: "list-pets",
    Health: "list-health"
  };

  // Variables to store the current tab's URL and (truncated) title
  let currentTabUrl = "";
  let currentTabTitle = "";

  // 1. When the popup opens, get the active tab's info and show a preview
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // If for some reason no active tab is found, show a simple message
    if (!activeTab) {
      itemPreview.textContent = "Current item: (no active tab found)";
      return;
    }

    // Save the tab's URL and title for later use when saving
    currentTabUrl = activeTab.url || "";
    currentTabTitle = truncateTitle(activeTab.title || currentTabUrl);

    // Show the truncated title in the preview area
    itemPreview.textContent = `Current item: ${currentTabTitle}`;
  });

  // 2. Load and display saved items every time the popup opens
  renderList();

  // 3. When the user clicks "Save Item"
  saveBtn.addEventListener("click", () => {
    const chosenCategory = categorySelect.value;

    // Require a category selection
    if (!chosenCategory) {
      alert("Please choose a category before saving 🙂");
      return;
    }

    // Make sure we have a URL for the current tab
    if (!currentTabUrl) {
      alert("Could not read the current tab. Please try again.");
      return;
    }

    // Create an object representing the item to save
    const newItem = {
      url: currentTabUrl,        // link to open
      title: currentTabTitle,    // truncated tab title
      category: chosenCategory   // one of Whisky / Lego / etc.
    };

    /*
      Get the existing shoppingList array from storage.
      If it doesn't exist yet, default to an empty array [].
    */
    chrome.storage.sync.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;

      // Add the new item to the end of the array
      list.push(newItem);

      // Save the updated array back into chrome.storage.sync
      chrome.storage.sync.set({ shoppingList: list }, () => {
        // After saving, re-render all category lists to show the new item
        renderList();
      });
    });
  });

  /**
   * Helper function: truncate a string to 50 characters.
   * If the title is longer than 50 characters, it is cut off.
   */
  function truncateTitle(title) {
    const maxLength = 50;
    if (title.length <= maxLength) {
      return title;
    }
    return title.slice(0, maxLength);
  }

  /**
   * Render all saved items from chrome.storage.sync into the category lists.
   * Each category has its own <ul> and we place matching items in the right one.
   * Category sections are only shown if they contain items.
   */
  function renderList() {
    chrome.storage.sync.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;

      // First, clear all category lists AND hide all sections
      Object.values(categoryToListId).forEach((listId) => {
        const ul = document.getElementById(listId);
        if (ul) {
          ul.innerHTML = "";

          // Hide the whole category section by default
          const section = ul.closest(".category-section");
          if (section) {
            section.style.display = "none";
          }
        }
      });

      // Loop over every saved item and put it into the correct category <ul>
      list.forEach((item, index) => {
        const listId = categoryToListId[item.category];
        const ul = document.getElementById(listId);

        // If the category is unknown (e.g. from old data), just skip it safely
        if (!ul) return;

        // Ensure the category section is visible because it now has at least one item
        const section = ul.closest(".category-section");
        if (section) {
          section.style.display = "block";
        }

        // Create the <li> container for this row
        const li = document.createElement("li");
        li.className = "list-item";

        // Left side: clickable link with the item title
        const contentDiv = document.createElement("div");
        contentDiv.className = "list-content";

        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank"; // open link in a new tab
        link.textContent = truncateTitle(item.title || item.url);

        contentDiv.appendChild(link);

        // Right side: delete button with trash icon
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;

        // When delete is clicked, remove this item permanently
        deleteBtn.addEventListener("click", () => {
          deleteItem(index);
        });

        // Assemble the row and add it to the correct category list
        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
      });
    });
  }

  /**
   * Permanently delete an item at the given index from storage
   * and refresh the displayed lists.
   */
  function deleteItem(index) {
    chrome.storage.sync.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;

      // Remove exactly one item at the specified index
      list.splice(index, 1);

      // Save the updated list back into storage
      chrome.storage.sync.set({ shoppingList: list }, () => {
        // Re-render lists so the deleted item disappears from the UI
        renderList();
      });
    });
  }
});






