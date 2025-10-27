// Main JavaScript functionality for Prague Dan Brown Website
// This file will contain core functionality and initialization

document.addEventListener('DOMContentLoaded', function() {
    console.log('Prague Dan Brown Website loaded');
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize FAQ functionality
    initFAQ();
    
    // Initialize navbar scroll effect
    initNavbarScrollEffect();
});

// Initialize scroll-triggered animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize smooth scrolling for internal links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
// Initialize mobile menu functionality
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            
            // Toggle menu visibility
            mobileMenu.classList.toggle('hidden');
            
            // Update aria-expanded attribute
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            
            // Update button icon
            const icon = mobileMenuButton.querySelector('svg path');
            if (!isExpanded) {
                // Change to X icon
                icon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            } else {
                // Change back to hamburger icon
                icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                
                // Reset icon to hamburger
                const icon = mobileMenuButton.querySelector('svg path');
                icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            });
        });
    }
}

// Initialize FAQ accordion functionality
function initFAQ() {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const content = faqItem.querySelector('.faq-content');
            const icon = this.querySelector('.faq-icon');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Close all other FAQ items
            faqToggles.forEach(otherToggle => {
                if (otherToggle !== this) {
                    const otherItem = otherToggle.closest('.faq-item');
                    const otherContent = otherItem.querySelector('.faq-content');
                    const otherIcon = otherToggle.querySelector('.faq-icon');
                    
                    otherToggle.setAttribute('aria-expanded', 'false');
                    otherContent.style.maxHeight = '0';
                    otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current item
            if (!isExpanded) {
                // Open current item
                this.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
                
                // Scroll item into view with offset for fixed header
                setTimeout(() => {
                    const headerHeight = 120;
                    const elementTop = faqItem.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementTop - headerHeight;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 150);
            } else {
                // Close current item
                this.setAttribute('aria-expanded', 'false');
                content.style.maxHeight = '0';
                icon.style.transform = 'rotate(0deg)';
            }
        });
        
        // Handle keyboard navigation
        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Initialize navbar scroll effect
function initNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar-floating');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset > 50;
            
            if (scrolled) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}