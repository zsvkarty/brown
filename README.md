# Prague Dan Brown Website

A marketing and booking website for Dan Brown-themed excursions in Prague, offering both private guided tours and escape room experiences.

## Project Structure

```
prague-dan-brown-website/
├── index.html              # Main landing page (to be created)
├── private-tour.html       # Private tour service page (to be created)
├── escape-room.html        # Escape room service page (to be created)
├── css/
│   ├── input.css          # Tailwind directives and custom styles
│   └── output.css         # Compiled Tailwind CSS
├── js/
│   ├── main.js            # Core functionality and scroll animations
│   ├── cart.js            # Cart and booking logic
│   └── animations.js      # UI animations and effects
├── images/
│   ├── hero.webp          # Main hero image (existing)
│   ├── services/          # Service-related images (to be added)
│   └── icons/             # UI icons (to be added)
├── tailwind.config.js     # Tailwind configuration with Dan Brown theme
├── package.json           # Dependencies and build scripts
└── README.md              # This file
```

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build CSS (development with watch mode):
   ```bash
   npm run build-css
   ```

3. Build CSS (production - minified):
   ```bash
   npm run build-css-prod
   ```

## Design System

### Color Palette
- **Primary Dark**: #1a1a2e (Deep navy)
- **Primary Medium**: #16213e (Medium blue)
- **Accent Gold**: #d4af37 (Elegant gold)
- **Text Light**: #f8f9fa (Off-white)
- **Text Gray**: #6c757d (Medium gray)
- **Error Red**: #dc3545 (Error states)
- **Success Green**: #28a745 (Success states)

### Typography
- **Headlines**: Playfair Display (serif, elegant)
- **Body Text**: Inter (sans-serif, readable)
- **Buttons**: Inter Medium (clear, actionable)

### Custom Components
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.section-padding` - Consistent section spacing
- `.container-custom` - Container with max-width and padding
- `.card-service` - Service preview cards
- `.form-input` - Styled form inputs
- `.animate-on-scroll` - Scroll-triggered animations

## Features
- Responsive design optimized for mobile and desktop
- Smooth scroll animations and micro-interactions
- Cart-based booking system with localStorage persistence
- Stripe Payment Links integration
- Accessibility-compliant components
- Performance-optimized with lazy loading

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Next Steps
1. Create HTML pages (index.html, private-tour.html, escape-room.html)
2. Implement hero section with hero.webp background
3. Build service selection and FAQ components
4. Integrate Stripe Payment Links
5. Add responsive design and mobile optimization