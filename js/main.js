// Main JavaScript functionality for Prague Dan Brown Website
// This file will contain core functionality and initialization

document.addEventListener('DOMContentLoaded', function() {
    console.log('Prague Dan Brown Website loaded');
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Initialize FAQ functionality
    initFAQ();
    
    // Header: mobile menu + hide on scroll
    initSiteMenu();
    initHeaderAutoHide();

    // Home page: the 12 stops rail
    initStopsRail();
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
// FAQ accordion: one answer open at a time. Closed answers are inert so
// their text isn't tabbable or read out while hidden.
function initFAQ() {
    const buttons = document.querySelectorAll('.faq__q button');

    function set(button, open) {
        button.setAttribute('aria-expanded', String(open));
        const answer = document.getElementById(button.getAttribute('aria-controls'));
        if (open) answer.removeAttribute('inert');
        else answer.setAttribute('inert', '');
    }

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const open = button.getAttribute('aria-expanded') !== 'true';
            buttons.forEach((other) => set(other, false));
            set(button, open);
        });
    });
}

// Full-screen menu for small screens. Opening animates the panel's
// clip-path out of the menu button's corner (see .site-menu in css/input.css).
function initSiteMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('site-menu');
    const closeBtn = document.getElementById('menu-close');
    const header = document.getElementById('site-header');
    if (!toggle || !menu || !closeBtn) return;

    function open() {
        menu.removeAttribute('inert');
        menu.classList.add('is-open');
        header?.classList.add('menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        document.documentElement.style.overflow = 'hidden';
        closeBtn.focus({ preventScroll: true });
    }

    function close({ restoreFocus = true } = {}) {
        if (!menu.classList.contains('is-open')) return;
        menu.classList.remove('is-open');
        header?.classList.remove('menu-open');
        menu.setAttribute('inert', '');
        toggle.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
        if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());

    // Capture phase, so the menu is closed (and scrolling unlocked) before
    // the smooth-scroll handler on in-page links runs.
    menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) close({ restoreFocus: false });
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });

    // The menu only exists below the desktop breakpoint.
    window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
        if (e.matches) close({ restoreFocus: false });
    });
}

// Hide the header while scrolling down, bring it back on any scroll up.
function initHeaderAutoHide() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            const delta = y - lastY;
            if (y < 120 || delta < -4) header.classList.remove('is-hidden');
            else if (delta > 4) header.classList.add('is-hidden');
            lastY = y;
            ticking = false;
        });
    }, { passive: true });
}

// Horizontal rail of the 12 stops: arrows page through it, the thin line
// under it shows which part of the rail is in view.
function initStopsRail() {
    const rail = document.getElementById('stops-rail');
    if (!rail) return;
    const section = rail.closest('.stops');
    const prev = section.querySelector('[data-stops-prev]');
    const next = section.querySelector('[data-stops-next]');
    const bar = section.querySelector('.stops__progress span');

    function update() {
        const max = rail.scrollWidth - rail.clientWidth;
        prev.disabled = rail.scrollLeft <= 2;
        next.disabled = rail.scrollLeft >= max - 2;
        if (bar) {
            bar.style.width = (rail.clientWidth / rail.scrollWidth) * 100 + '%';
            bar.style.left = (rail.scrollLeft / rail.scrollWidth) * 100 + '%';
        }
    }

    function page(direction) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}
