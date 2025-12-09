# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Lakshya Parmar, an AI-powered MERN Stack Frontend Engineer. It's a static HTML/CSS/JavaScript site focused on showcasing projects, skills, and facilitating contact. The site is deployed to Netlify and emphasizes performance, accessibility, and modern design.

## Development Environment

**No build tool or package manager is required.** This is a vanilla HTML/CSS/JavaScript project with external CDN dependencies.

### Key Technologies
- **HTML5**: Semantic markup with SEO optimization (JSON-LD structured data, Open Graph tags, canonical URLs)
- **CSS3**: Custom properties (CSS variables), gradients, animations, flexbox, grid, glass-morphism design
- **Vanilla JavaScript**: ES6+ with event handling, DOM manipulation, and localStorage for state management
- **External Libraries** (via CDN):
  - **AOS (Animate On Scroll)**: Intersection Observer-based scroll animations with reduced motion accessibility support
  - **EmailJS**: Client-side email form submission without a backend
  - **Ionicons**: Icon library for social links and UI elements

### Development Server

Use Live Server to develop locally:
```
- VS Code extension: Live Server (recommended, configured on port 5502 in `.vscode/settings.json`)
- or run: python -m http.server 5500 (Python 3)
- or use any local HTTP server (e.g., npx http-server)
```

## Architecture Overview

### Directory Structure
- **`index.html`**: Single HTML file containing all page sections (hero, about, skills, projects, contact, footer)
- **`css/styles.css`**: All styling with CSS custom properties for theming (dark mode at `:root`, light mode at `html.light`)
- **`js/main.js`**: All client-side logic organized into functional sections (see below)
- **`assets/`**: Images, favicon, and resume PDF
- **`robots.txt` & `sitemap.xml`**: SEO configuration for search engines

### Key JavaScript Modules (in `js/main.js`)

All functionality is organized in a single file with these functional sections:

1. **Theme Toggle**: Switches between dark/light mode, persists to localStorage, applies smooth transitions
2. **AOS Initialization**: Configures Animate On Scroll with mobile-safe settings (respects `prefers-reduced-motion`, recalculates on load/orientation change)
3. **Skill Dots Rendering**: Dynamically creates visual skill level indicators based on `data-level` attributes
4. **Smooth Scrolling**: Navigation anchor links scroll smoothly to target sections
5. **Scroll Animations**: Intersection Observer pattern for `[data-animate]` elements (foundation for future animations)
6. **Typewriter Effect**: Custom implementation for hero tagline with looping, configurable speeds, and cursor display
7. **EmailJS Integration**: Contact form submission using EmailJS credentials (Service ID: `service_vvfb85q`, Template ID: `template_q6dupu2`)

### Design System

**CSS Variables** (`--bg`, `--panel`, `--accent1`, `--accent2`, `--muted`, `--glass`, `--radius`) enable theme switching. The light theme overrides these at the `html.light` selector. All transitions use a consistent easing function (`--theme-ease: cubic-bezier(.2,.8,.2,1)`) with 320ms duration.

### Accessibility & Performance Considerations

- **Reduced motion support**: Animations are disabled if user has `prefers-reduced-motion: reduce` preference
- **Semantic HTML**: Proper heading hierarchy, ARIA labels on interactive elements (theme toggle, social links)
- **Form validation**: HTML5 required attributes on contact form inputs
- **Lazy animations**: AOS triggers animations on scroll; typewriter only starts when needed
- **No JavaScript blocking**: All external scripts load asynchronously or at end of body

## Common Development Tasks

### Add a new section or component
1. Add HTML to `index.html` within the `<main>` element
2. Add corresponding CSS to `css/styles.css` using existing CSS variables for colors
3. Initialize any interactive features in `js/main.js` inside the `DOMContentLoaded` event

### Modify theme colors or styling
- Update CSS custom properties in `:root` (dark mode) or `html.light` (light mode)
- Use `--accent1`, `--accent2`, `--muted` for text; `--glass` for semi-transparent backgrounds

### Update the typewriter effect
- Edit the `data-texts` JSON array in `index.html` line 93
- Adjust `data-typing-speed`, `data-deleting-speed`, `data-pause` attributes to change animation speed

### Debug EmailJS issues
- Verify credentials in `js/main.js` lines 164 and 174
- Check browser console for EmailJS errors
- Ensure form inputs have matching `name` attributes to template variables

### Test on different devices
- Use VS Code Live Server extension (port 5502) or your preferred local server
- Test with browser dev tools responsive mode (mobile/tablet/desktop)
- Verify theme toggle and smooth scrolling work on touch devices

## Deployment & Production

The site is deployed to **Netlify** from the GitHub repository (master branch). Push changes to trigger automatic deployment. Ensure:
- No sensitive data in commits (EmailJS public key is safe to expose)
- Test locally before pushing
- Check the live site (https://lakshya-parmar.netlify.app/) after deployment

## Notes for Future Development

- **Form backend**: Currently, the contact form uses EmailJS. If transitioning to a backend API, remove EmailJS script and update `js/main.js` to handle API requests
- **Scalability**: If adding many more projects or sections, consider splitting `js/main.js` into modules or using a lightweight framework
- **SEO**: The site includes JSON-LD structured data, Open Graph tags, and a sitemap. Update these when adding new content
- **Mobile responsiveness**: The CSS uses viewport-relative units and media queries. Test mobile breakpoints when adding new sections
