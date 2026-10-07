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

    // Home page: open the hero once its photo is ready
    initHeroReveal();

    // Locations page: stacked chapters
    initChapters();

    // Desktop: headings rise in, the price panel opens
    initEntrances();
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
    if (!header || header.dataset.autohide === 'off') return;

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

// The 12 stops rail on the home page.
// Desktop with motion: the section pins and the rail slides sideways as you
// scroll down (the stage sticks; --travel makes the section tall enough).
// Otherwise: a normal horizontal scroller with arrows. The thin line under
// the rail shows which part of it is in view in both modes.
function initStopsRail() {
    const rail = document.getElementById('stops-rail');
    if (!rail) return;
    const section = rail.closest('.stops');
    const viewport = section.querySelector('.stops__viewport');
    const prev = section.querySelector('[data-stops-prev]');
    const next = section.querySelector('[data-stops-next]');
    const bar = section.querySelector('.stops__progress span');
    const desktop = window.matchMedia('(min-width: 960px)');
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const clamp = (x) => Math.min(1, Math.max(0, x));
    const SPEED = 1.5; // px of sideways movement per px scrolled
    let travel = 0;

    const pinned = () => section.classList.contains('stops--pinned');

    function setBar(fraction, start) {
        if (!bar) return;
        bar.style.width = fraction * 100 + '%';
        bar.style.left = start * 100 + '%';
    }

    function updateList() {
        const max = rail.scrollWidth - rail.clientWidth;
        prev.disabled = rail.scrollLeft <= 2;
        next.disabled = rail.scrollLeft >= max - 2;
        setBar(rail.clientWidth / rail.scrollWidth, rail.scrollLeft / rail.scrollWidth);
    }

    function progress() {
        const distance = section.offsetHeight - window.innerHeight;
        return distance > 0 ? clamp(-section.getBoundingClientRect().top / distance) : 0;
    }

    function updatePinned() {
        const p = progress();
        rail.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
        const visible = viewport.clientWidth / rail.scrollWidth;
        setBar(visible, p * (1 - visible));
    }

    function setMode() {
        const pin = desktop.matches && motion.matches;
        section.classList.toggle('stops--pinned', pin);
        rail.style.transform = '';
        rail.scrollLeft = 0;
        if (pin) {
            // + the rail's right padding, which scrollWidth leaves out
            const padRight = parseFloat(getComputedStyle(rail).paddingRight) || 0;
            travel = Math.max(0, rail.scrollWidth + padRight - viewport.clientWidth);
            section.style.setProperty('--travel', travel / SPEED + 'px');
            updatePinned();
        } else {
            section.style.removeProperty('--travel');
            updateList();
        }
    }

    function page(direction) {
        rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: motion.matches ? 'smooth' : 'auto' });
    }

    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    rail.addEventListener('scroll', () => { if (!pinned()) updateList(); }, { passive: true });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!pinned() || ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updatePinned(); ticking = false; });
    }, { passive: true });

    // Tabbing to a card that's off to the side: scroll the page to where
    // the rail shows it, instead of letting the browser shift the viewport.
    rail.addEventListener('focusin', (e) => {
        if (!pinned()) return;
        const card = e.target.closest('.stop-card');
        if (!card) return;
        viewport.scrollLeft = 0;
        const p = travel > 0 ? clamp((card.offsetLeft - 40) / travel) : 0;
        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + p * (section.offsetHeight - window.innerHeight), behavior: 'auto' });
    });

    window.addEventListener('resize', setMode);
    desktop.addEventListener('change', setMode);
    motion.addEventListener('change', setMode);
    setMode();
}

// Desktop entrances: section headings rise line by line, the gold price
// panel opens out of a point. Each plays once, when it comes into view.
function initEntrances() {
    const ok = window.matchMedia('(min-width: 960px)').matches &&
        window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (!ok || !('IntersectionObserver' in window)) return;

    const headings = document.querySelectorAll(
        '.stops__title, .tour__title, .faq__title, .site-footer__cta-title, .route-intro__title'
    );
    headings.forEach((el) => {
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        el.setAttribute('aria-label', text);
        el.textContent = '';
        text.split(' ').forEach((word, i) => {
            if (i) el.appendChild(document.createTextNode(' '));
            const outer = document.createElement('span');
            outer.className = 'rl';
            outer.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.textContent = word;
            outer.appendChild(inner);
            el.appendChild(outer);
        });
        // number the lines so each one starts a little after the one above
        let line = -1;
        let lastTop = null;
        el.querySelectorAll('.rl').forEach((w) => {
            if (w.offsetTop !== lastTop) { line += 1; lastTop = w.offsetTop; }
            w.firstChild.style.setProperty('--l', line);
        });
    });

    // A panel clipped down to a point counts as invisible to the observer,
    // so watch its parent and open the panel from there.
    const targets = new Map();
    headings.forEach((el) => targets.set(el, el));
    document.querySelectorAll('.tour__price').forEach((el) => {
        el.classList.add('opens-from-point');
        targets.set(el.parentElement, el);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            targets.get(entry.target).classList.add('is-shown');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.35 });
    targets.forEach((_, watched) => observer.observe(watched));
}

// Opens the hero (see "Hero reveal" in css/input.css). Waits for the photo
// so it doesn't pop in half-loaded, but never more than 700ms.
function initHeroReveal() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const img = hero.querySelector('.hero__media img');
    const reveal = () => requestAnimationFrame(() => hero.classList.add('is-revealed'));

    if (!img || img.complete) { reveal(); return; }
    const timer = setTimeout(reveal, 700);
    img.addEventListener('load', () => { clearTimeout(timer); reveal(); }, { once: true });
    img.addEventListener('error', () => { clearTimeout(timer); reveal(); }, { once: true });
}

// Locations page: the 12 stops as stacked chapters on desktop (each next
// stop grows in from the bottom-left corner), a plain list elsewhere.
function initChapters() {
    const section = document.getElementById('chapters');
    if (!section) return;
    const chapters = [...section.querySelectorAll('.chapter')];
    const bar = section.querySelector('.chapters__progress span');
    const desktop = window.matchMedia('(min-width: 960px)');
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');

    // slow-fast-slow, like the museum's wipe
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const clamp = (x) => Math.min(1, Math.max(0, x));

    function update() {
        const step = window.innerHeight * 0.85;
        const scrolled = -section.getBoundingClientRect().top;
        chapters.forEach((ch, i) => {
            if (i === 0) return;
            // first 70% of each step grows the chapter, the rest holds it still
            const local = (scrolled - (i - 1) * step) / step;
            const grow = clamp(local / 0.7);
            ch.style.setProperty('--p', ease(grow).toFixed(4));
            ch.style.setProperty('--t', clamp((grow - 0.75) / 0.25).toFixed(3));
        });
        const total = (chapters.length - 1) * step;
        bar.style.width = clamp(scrolled / total) * 100 + '%';
    }

    function setMode() {
        const stack = desktop.matches && motion.matches;
        section.classList.toggle('chapters--stack', stack);
        section.classList.toggle('chapters--list', !stack);
        if (stack) {
            update();
        } else {
            chapters.forEach((ch) => { ch.style.removeProperty('--p'); ch.style.removeProperty('--t'); });
        }
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking || !section.classList.contains('chapters--stack')) return;
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', () => section.classList.contains('chapters--stack') && update());
    desktop.addEventListener('change', setMode);
    motion.addEventListener('change', setMode);
    setMode();

    // Links like tour-locations.html#stop-7: in the stacked layout all
    // chapters share one spot, so scroll to where that one has grown in.
    function goToHash() {
        const match = /^#stop-(\d+)$/.exec(window.location.hash);
        if (!match || !section.classList.contains('chapters--stack')) return;
        const i = Math.min(chapters.length, Math.max(1, Number(match[1]))) - 1;
        const step = window.innerHeight * 0.85;
        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + Math.max(0, i - 1) * step + (i > 0 ? step * 0.75 : 0), behavior: 'auto' });
    }
    window.addEventListener('hashchange', goToHash);
    window.addEventListener('load', goToHash);
}
