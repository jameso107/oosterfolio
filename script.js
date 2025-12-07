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
    
    // Return paths relative to web root (images are in repo root, not in images/ folder)
    // These paths will work on both GitHub Pages and Vercel
    return imageFiles.map(file => file);
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
        // Create 3 sets of photos for seamless loop
        for (let set = 0; set < 3; set++) {
            photos.forEach((photoPath, index) => {
                const img = document.createElement('img');
                img.src = photoPath;
                img.className = 'photo-item';
                img.alt = 'Portfolio photo';
                img.loading = 'lazy';
                
                // Handle image load errors gracefully
                img.onerror = function() {
                    // Image doesn't exist or failed to load - hide it silently
                    // This allows the code to work with whatever images are available on GitHub
                    this.style.display = 'none';
                    this.style.visibility = 'hidden';
                };
                
                // Track successful loads
                img.onload = function() {
                    // Image loaded successfully from GitHub - make it visible
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
    
    createPhotoRow(leftPhotos, leftSlider);
    createPhotoRow(rightPhotos, rightSlider);
    
    // Set varying animation speeds
    const leftSpeed = 25 + Math.random() * 10; // 25-35s
    const rightSpeed = 30 + Math.random() * 10; // 30-40s
    
    leftSlider.style.animationDuration = `${leftSpeed}s`;
    rightSlider.style.animationDuration = `${rightSpeed}s`;
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

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

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

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

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

