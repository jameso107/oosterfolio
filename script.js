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
    modal.dataset.returnFocus = '1';
    lastFocusedElement = document.activeElement;
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
}

let lastFocusedElement = null;

// Case study modal: clones an inert <template> into the shared modal shell,
// so AI Work case studies pop out the same way the robot cards do.
function openCaseStudyModal(templateId) {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const template = document.getElementById(templateId);
    if (!modal || !modalBody || !template) return;

    modalBody.innerHTML = '';
    modalBody.appendChild(template.content.cloneNode(true));

    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    lastFocusedElement = document.activeElement;
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }

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
        'img-9922_orig.jpg'
    ];
    
    // Return paths - check if images are in root or in images/ folder
    // Try root first, then images/ folder as fallback
    // Absolute so the sliders also work on a company page rendered at /<slug>.
    // If an image is missing the onerror handler hides it silently.
    return imageFiles.map(file => `/${file}`);
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
// Plays once per browser session, can be skipped with any tap or key press,
// and is bypassed entirely when the visitor prefers reduced motion.
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('animation-overlay');
    const body = document.body;

    // Initialize photo sliders
    initPhotoSliders();

    const finishIntro = () => {
        if (body.dataset.introDone === '1') return;
        body.dataset.introDone = '1';
        body.classList.remove('animating');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 800);
        }
        document.dispatchEvent(new CustomEvent('intro:done'));
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seenIntro = sessionStorage.getItem('introSeen') === '1';

    if (!overlay || seenIntro || reducedMotion) {
        if (overlay) {
            overlay.style.display = 'none';
        }
        finishIntro();
        return;
    }

    try {
        sessionStorage.setItem('introSeen', '1');
    } catch (e) {
        // Private browsing may block storage; the intro just plays again next time
    }
    body.classList.add('animating');

    overlay.addEventListener('pointerdown', finishIntro);
    document.addEventListener('keydown', finishIntro, { once: true });
    setTimeout(finishIntro, 2800);
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
if (hamburger && navMenu) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

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
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation, starting as soon as the intro finishes
document.addEventListener('DOMContentLoaded', () => {
    const setupScrollAnimations = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const animateElements = document.querySelectorAll('.about-card, .project-card, .timeline-item, .ai-card, .news-card');

        animateElements.forEach(el => {
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'transform 0.6s ease';
            observer.observe(el);
        });
    };

    if (document.body.dataset.introDone === '1') {
        setupScrollAnimations();
    } else {
        document.addEventListener('intro:done', setupScrollAnimations, { once: true });
    }
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
        if (projectModal && projectModal.classList.contains('active')) {
            closeProjectModal();
        } else if (resumeModal && resumeModal.classList.contains('active')) {
            closeResumeModal();
        }
    }
});

// Resume Modal functionality
function openResumeModal() {
    const modal = document.getElementById('resume-modal');
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    lastFocusedElement = document.activeElement;
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
}

function closeResumeModal() {
    const modal = document.getElementById('resume-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}


