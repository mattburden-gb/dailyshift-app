// ===== PORTFOLIO SLIDER LOGIC =====

// Select all slides and dots so we can control them in JavaScript
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

// Keep track of which slide is currently active (start with slide 0)
let currentSlideIndex = 0;

/**
 * showSlide:
 * This function activates a slide by its index and updates
 * the dot navigation to match.
 */
function showSlide(index) {
  // Guard clause: if index is out of range, do nothing
  if (index < 0 || index >= slides.length) return;

  // Remove "active" class from all slides and dots
  slides.forEach((slide) => slide.classList.remove('active'));
  dots.forEach((dot) => dot.classList.remove('active'));

  // Add "active" class to the selected slide and dot
  slides[index].classList.add('active');
  dots[index].classList.add('active');

  // Update the current slide index
  currentSlideIndex = index;
}

/**
 * attachDotListeners:
 * Adds a click event listener to each dot so that clicking on a dot
 * will switch to the corresponding slide.
 */
function attachDotListeners() {
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      // Read which slide this dot is linked to via its data-slide attribute
      const targetIndex = parseInt(dot.getAttribute('data-slide'), 10);

      // Call showSlide to change to that slide
      showSlide(targetIndex);
    });
  });
}
function autoAdvanceSlides() {
  let nextIndex = (currentSlideIndex + 1) % slides.length;
  showSlide(nextIndex);
}

// Rotate every 5000 ms (5 seconds)
setInterval(autoAdvanceSlides, 5000);
// Run this after the script loads to set up the slider
attachDotListeners();

// Optionally, you could add automatic slide rotation here later if you like.
// For example:
// setInterval(() => {
//   let nextIndex = (currentSlideIndex + 1) % slides.length;
//   showSlide(nextIndex);
// }, 5000);
