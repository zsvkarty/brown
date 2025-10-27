// Animation utilities for Prague Dan Brown Website
// This file contains reusable animation functions and effects

// Fade in animation for elements
function fadeInElement(element, delay = 0) {
    setTimeout(() => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        // Trigger animation
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }, delay);
}

// Stagger animation for multiple elements
function staggerAnimation(elements, delayBetween = 100) {
    elements.forEach((element, index) => {
        fadeInElement(element, index * delayBetween);
    });
}

// Loading spinner animation
function showLoadingSpinner(button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
    `;
    
    return () => {
        button.disabled = false;
        button.textContent = originalText;
    };
}

// Smooth height transition for accordion elements
function toggleAccordion(element) {
    const content = element.querySelector('.accordion-content');
    const isOpen = element.classList.contains('open');
    
    if (isOpen) {
        // Close
        content.style.maxHeight = content.scrollHeight + 'px';
        requestAnimationFrame(() => {
            content.style.maxHeight = '0';
        });
        element.classList.remove('open');
    } else {
        // Open
        content.style.maxHeight = content.scrollHeight + 'px';
        element.classList.add('open');
        
        // Reset max-height after animation
        setTimeout(() => {
            if (element.classList.contains('open')) {
                content.style.maxHeight = 'none';
            }
        }, 300);
    }
}

// Parallax effect for hero section
function initParallax() {
    const heroSection = document.querySelector('.bg-hero');
    if (!heroSection) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroSection.style.transform = `translateY(${rate}px)`;
    });
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize parallax effect
    initParallax();
    
    // Initialize accordion functionality
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        const trigger = item.querySelector('.accordion-trigger');
        if (trigger) {
            trigger.addEventListener('click', () => toggleAccordion(item));
        }
    });
});