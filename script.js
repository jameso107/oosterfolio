// Project Modal functionality - defined early to ensure availability
function openProjectModal(projectId) {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const expandedContent = document.querySelector(`[data-project-id="${projectId}"]`);
    
    if (!expandedContent) return;
    
    const projectCard = expandedContent.closest('.project-card');
    const projectTitle = projectCard.querySelector('.project-overlay h3')?.textContent || '';
    const projectRole = projectCard.querySelector('.project-role')?.textContent || '';
    const projectDescription = projectCard.querySelector('.project-description')?.textContent || '';
    const projectSpecs = projectCard.querySelector('.project-specs')?.cloneNode(true);
    
    // Build modal content
    modalBody.innerHTML = '';
    
    // Add title
    if (projectTitle) {
        const titleEl = document.createElement('h2');
        titleEl.className = 'modal-title';
        titleEl.textContent = projectTitle;
        modalBody.appendChild(titleEl);
    }
    
    // Add role
    if (projectRole) {
        const roleEl = document.createElement('div');
        roleEl.className = 'modal-role';
        roleEl.textContent = projectRole;
        modalBody.appendChild(roleEl);
    }
    
    // Add description
    if (projectDescription) {
        const descEl = document.createElement('p');
        descEl.className = 'modal-description';
        descEl.textContent = projectDescription;
        modalBody.appendChild(descEl);
    }
    
    // Add specs
    if (projectSpecs) {
        modalBody.appendChild(projectSpecs);
    }
    
    // Clone and add expanded content
    const contentClone = expandedContent.cloneNode(true);
    contentClone.style.display = 'block';
    modalBody.appendChild(contentClone);
    
    // Show modal with animation
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear modal content after animation
    setTimeout(() => {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = '';
    }, 300);
}

// Photo paths - dynamically load from repo root
// Images are uploaded individually to the GitHub repo root
function getPhotoPaths() {
    // List of all image filenames that are in the repo root
    // The code will try to load each one - if it exists, it will display
    // If it doesn't exist, it will be silently skipped
    const imageFiles = [
        '0.jpg',
        '467945468_10161669235112432_7486269392858657050_n.jpg',
        '471615613_10161969345297432_554194538844078805_n.jpg',
        '60885881_293523741556674_1007032946009309184_n.jpg',
        '8e94b5dd-c7e8-4c7d-9d15-e8ab9e6ca8ac_orig.jpg',
        'img-0273_orig.jpg',
        'img-0859_orig.jpg',
        'img-0867_orig.jpg',
        'img-1006_orig.jpg',
        'img-1230_orig.jpg',
        'img-2095-1_orig.jpg',
        'img-2341_orig.jpg',
        'img-3434_orig.jpg',
        'img-5776.jpg',
        'img-7941-2_orig.jpg',
        'img-7986_orig.jpg',
        'img-9472_orig.jpg',
        'img-9519_orig.jpg',
        'img-9646_orig.jpg',
        'img-9922_orig.jpg',
        'Screenshot 2025-02-07 at 2.29.03 PM.png',
        'screenshot-2023-08-31-at-2-19-54-pm.png'
    ];
    
    // Return paths - check if images are in root or in images/ folder
    // Try root first, then images/ folder as fallback
    return imageFiles.map(file => {
        // Try root directory first (if uploaded individually)
        return file;
        // If that doesn't work, the onerror handler will hide the image
        // Alternative: return `images/${file}` if images are in a folder
    });
}

// Initialize photo sliders
function initPhotoSliders() {
    const leftSlider = document.querySelector('.photo-slider-left');
    const rightSlider = document.querySelector('.photo-slider-right');
    
    if (!leftSlider || !rightSlider) return;
    
    const photoPaths = getPhotoPaths();
    
    // Shuffle photos for variety
    const shuffledPhotos = [...photoPaths].sort(() => Math.random() - 0.5);
    
    // Create multiple rows of photos for continuous scrolling
    const createPhotoRow = (photos, slider) => {
        // Clear any existing content
        slider.innerHTML = '';
        
        // Create exactly 4 sets of photos for seamless looping
        // When animation completes one set, the next set is in identical position
        for (let set = 0; set < 4; set++) {
            photos.forEach((photoPath, index) => {
                const img = document.createElement('img');
                // Try root directory first (if uploaded individually to repo root)
                img.src = photoPath;
                img.className = 'photo-item';
                img.alt = 'Portfolio photo';
                img.loading = 'lazy';
                
                // Handle image load errors gracefully
                // Images are in the repo root, so if they fail to load, they don't exist
                img.onerror = function() {
                    // Image doesn't exist or failed to load - hide it silently
                    this.style.display = 'none';
                    this.style.visibility = 'hidden';
                };
                
                // Track successful loads
                img.onload = function() {
                    // Image loaded successfully - make it visible
                    this.style.display = '';
                    this.style.visibility = 'visible';
                };
                
                // Add random vertical offset for more dynamic look
                const randomOffset = Math.random() * 100 - 50;
                img.style.transform = `translateY(${randomOffset}px)`;
                
                // Vary sizes slightly
                const randomScale = 0.8 + Math.random() * 0.4;
                img.style.width = `${300 * randomScale}px`;
                img.style.height = `${400 * randomScale}px`;
                
                slider.appendChild(img);
            });
        }
    };
    
    // Split photos between left and right sliders
    const midPoint = Math.ceil(shuffledPhotos.length / 2);
    const leftPhotos = shuffledPhotos.slice(0, midPoint);
    const rightPhotos = shuffledPhotos.slice(midPoint);
    
    // Create duplicates for seamless looping
    createPhotoRow(leftPhotos, leftSlider);
    createPhotoRow(rightPhotos, rightSlider);
    
    // Wait for images to load, then calculate animation
    setTimeout(() => {
        // Get the actual width of one set (quarter of total since we have 4 sets)
        const leftSliderWidth = leftSlider.scrollWidth / 4;
        const rightSliderWidth = rightSlider.scrollWidth / 4;
        
        // Calculate speed: pixels per second (much slower)
        const pixelsPerSecond = 20; // Much slower speed
        
        const leftSpeed = leftSliderWidth / pixelsPerSecond;
        const rightSpeed = rightSliderWidth / pixelsPerSecond;
        
        leftSlider.style.animationDuration = `${leftSpeed}s`;
        rightSlider.style.animationDuration = `${rightSpeed}s`;
    }, 100);
}

// Opening Animation Control
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('animation-overlay');
    const body = document.body;
    
    // Initialize photo sliders
    initPhotoSliders();
    
    // Add animating class to body to prevent scrolling
    body.classList.add('animating');
    
    // Total animation sequence: ~4 seconds
    // Block M slam: 0.1s delay + 1.2s duration = 1.3s
    // Shake: 0.8s delay + 0.3s duration = 1.1s
    // Ripples: 0.8s, 1.0s, 1.2s delays + 1.5s duration
    // Text fade in: 1.2s delay + 1s duration = 2.2s
    // Hold for a moment, then fade out
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        body.classList.remove('animating');
        
        // Remove overlay from DOM after fade completes
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 800);
    }, 4000); // Total animation time: 4 seconds
});

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation (delayed until after opening animation)
document.addEventListener('DOMContentLoaded', () => {
    // Wait for opening animation to complete before setting up scroll animations
    setTimeout(() => {
        const animateElements = document.querySelectorAll('.about-card, .project-card, .timeline-item');
        
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }, 4500); // Wait 4.5 seconds for opening animation to complete
});

// Add active state to navigation links based on scroll position
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});


// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const projectModal = document.getElementById('project-modal');
        const resumeModal = document.getElementById('resume-modal');
        if (projectModal.classList.contains('active')) {
            closeProjectModal();
        } else if (resumeModal.classList.contains('active')) {
            closeResumeModal();
        }
    }
});

// Resume Modal functionality
function openResumeModal() {
    const modal = document.getElementById('resume-modal');
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
}

function closeResumeModal() {
    const modal = document.getElementById('resume-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Awards Carousel functionality
let currentCarouselIndex = 1; // Start with card 2 highlighted (index 1, showing cards 1,2,3)
let carouselInterval = null;
const totalAwards = 8;

function initAwardsCarousel() {
    const carousel = document.getElementById('awards-carousel');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (!carousel) return;
    
    // Create dots for all 8 awards
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalAwards; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 1 ? ' active' : ''); // Card 2 (index 1) is active initially
        dot.setAttribute('aria-label', `Go to awards ${i + 1}`);
        dot.onclick = () => goToCarouselIndex(i);
        dotsContainer.appendChild(dot);
    }
    
    // Initial update
    updateCarousel();
    
    // Start auto-rotation
    startCarouselAutoRotate();
    
    // Pause on hover
    carousel.addEventListener('mouseenter', stopCarouselAutoRotate);
    carousel.addEventListener('mouseleave', startCarouselAutoRotate);
}

function moveCarousel(direction) {
    // Move the highlighted card index (the middle card)
    currentCarouselIndex += direction;
    
    // Loop around using modulo
    currentCarouselIndex = ((currentCarouselIndex % totalAwards) + totalAwards) % totalAwards;
    
    updateCarousel();
    resetCarouselAutoRotate();
}

function goToCarouselIndex(index) {
    currentCarouselIndex = Math.max(0, Math.min(index, totalAwards - 1));
    updateCarousel();
    resetCarouselAutoRotate();
}

function updateCarousel() {
    const carousel = document.getElementById('awards-carousel');
    const cards = carousel.querySelectorAll('.award-card');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!carousel || cards.length === 0) return;
    
    // Calculate which cards to show
    // currentCarouselIndex is the middle card (highlighted)
    const leftCardIndex = ((currentCarouselIndex - 1) % totalAwards + totalAwards) % totalAwards;
    const centerCardIndex = currentCarouselIndex;
    const rightCardIndex = ((currentCarouselIndex + 1) % totalAwards + totalAwards) % totalAwards;
    
    // Update all cards
    cards.forEach((card, index) => {
        // Remove all classes
        card.classList.remove('visible', 'center', 'side');
        
        if (index === centerCardIndex) {
            // Center card - magnified
            card.classList.add('visible', 'center');
        } else if (index === leftCardIndex || index === rightCardIndex) {
            // Side cards - smaller
            card.classList.add('visible', 'side');
        }
    });
    
    // Update active dot
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === centerCardIndex);
    });
}

function updateCarouselCards() {
    // This function is no longer needed as CSS handles the styling
    // But keeping it for compatibility
}

function updateCarouselCards() {
    const carousel = document.getElementById('awards-carousel');
    const cards = carousel.querySelectorAll('.award-card');
    
    if (!carousel || cards.length === 0) return;
    
    cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carousel.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - carouselCenter);
        const threshold = carouselRect.width / 6; // Middle third of carousel
        
        if (distanceFromCenter < threshold) {
            card.style.transform = 'scale(1.1)';
            card.style.opacity = '1';
            card.style.borderColor = 'var(--maize)';
            card.style.boxShadow = '0 10px 30px rgba(255, 203, 5, 0.4)';
        } else {
            card.style.transform = 'scale(0.9)';
            card.style.opacity = '0.8';
            card.style.borderColor = 'rgba(255, 203, 5, 0.2)';
            card.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        }
    });
}

function startCarouselAutoRotate() {
    stopCarouselAutoRotate();
    carouselInterval = setInterval(() => {
        moveCarousel(1);
    }, 4000);
}

function stopCarouselAutoRotate() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function resetCarouselAutoRotate() {
    stopCarouselAutoRotate();
    startCarouselAutoRotate();
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for opening animation to complete
    setTimeout(() => {
        initAwardsCarousel();
    }, 4500);
});

