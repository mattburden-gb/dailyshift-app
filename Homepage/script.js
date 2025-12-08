document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');

  // If there are no slides or dots, do nothing (prevents errors)
  if (slides.length === 0 || dots.length === 0) return;

  let currentSlide = 0;
  let slideInterval;

  // show a specific slide by index
  function showSlide(index) {
    // wrap around if index goes out of range
    if (index < 0) {
      index = slides.length - 1;
    } else if (index >= slides.length) {
      index = 0;
    }

    // remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // add active class to the current slide and dot
    slides[index].classList.add('active');
    dots[index].classList.add('active');

    currentSlide = index;
  }

  // go to next slide
  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  // start auto-rotation
  function startAutoRotate() {
    slideInterval = setInterval(nextSlide, 5000); // 5 seconds
  }

  // stop + restart on manual click
  function resetAutoRotate() {
    clearInterval(slideInterval);
    startAutoRotate();
  }

  // dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      resetAutoRotate();
    });
  });

  // initialise
  showSlide(0);
  startAutoRotate();
});


// go to next slide
function nextSlide() {
  showSlide(currentSlide + 1);
}

// start auto-rotation
function startAutoRotate() {
  slideInterval = setInterval(nextSlide, 5000); // 5 seconds
}

// stop + restart on manual click
function resetAutoRotate() {
  clearInterval(slideInterval);
  startAutoRotate();
}

// dot click handlers
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    showSlide(index);
    resetAutoRotate();
  });
});

// initialise
showSlide(0);
startAutoRotate();
