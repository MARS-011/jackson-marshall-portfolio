# Jackson Marshall — Personal Portfolio

A minimalist, cosmic-themed personal portfolio website featuring a generative particle attractor background animation, clinical instrument-readout aesthetic, and smooth scroll animations.

## Features

- **Cosmic Background Animation**: Full-screen looping WebM/MP4 video with lavender-white particles on deep navy background
- **Responsive Design**: Mobile-first approach with fluid typography and layout
- **Smooth Scroll**: Lenis scroll library for buttery-smooth scrolling experience
- **GSAP Animations**: ScrollTrigger-based section reveals and staggered project card animations
- **Accessibility**: Respects `prefers-reduced-motion` and includes semantic HTML
- **Performance**: Optimized video (9.1MB WebM, 84MB MP4 fallback), no build step required

## Project Structure

```
jackson-portfolio/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling (no framework)
├── js/
│   └── main.js             # GSAP, Lenis, video control
├── assets/
│   └── videos/
│       ├── orbis_blueprint.webm    # Primary (compressed)
│       └── orbis_blueprint.mp4     # Fallback
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep Navy | `#0a0e2e` |
| Primary Text | Near-White Lavender | `#e8ecff` |
| Accent | Particle Lavender | `#b8c5ff` |
| Secondary Text | Muted Blue-Grey | `#5a6490` |

## Typography

- **Display/Headings**: Cormorant Garamond (geometric serif)
- **Body/Labels**: IBM Plex Mono (technical, clinical)
- **UI Tags**: Space Mono (condensed uppercase)

## Sections

1. **Hero**: Full viewport with name and subtitle, GSAP staggered fade-up
2. **About**: Bio paragraph and certification badges
3. **Projects**: Minimal card grid with project details and tech stacks
4. **Contact**: Email and phone, centered, large mono type

## Animations

- **ScrollTrigger**: Sections fade in from `translateY(30px)` as they enter viewport
- **Lenis**: Smooth scroll throughout the page
- **Card Hover**: Border color brightens on hover (no scale transforms)
- **Stagger**: Project cards animate sequentially on scroll

## Deployment to GitHub Pages

### Prerequisites

- GitHub account
- Git installed locally

### Steps

1. **Create a new GitHub repository** named `jackson-marshall` (or any name)

2. **Add remote and push**:
   ```bash
   cd jackson-portfolio
   git add .
   git commit -m "Initial commit: cosmic portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jackson-marshall.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Set **Source** to `main` branch, root directory
   - Save

4. **Your site is live** at: `https://YOUR_USERNAME.github.io/jackson-marshall/`

### Custom Domain (Optional)

1. In repository **Settings** → **Pages**, add your custom domain
2. Update DNS records with your registrar to point to GitHub Pages
3. GitHub will automatically provision an SSL certificate

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Performance Notes

- Video pauses when tab is hidden (Page Visibility API)
- WebM format for modern browsers (~9.1MB)
- MP4 fallback for older browsers (~84MB)
- No JavaScript dependencies except GSAP and Lenis (loaded from CDN)
- Static HTML/CSS/JS — no build step required

## Customization

### Change Colors

Edit `css/styles.css`:
```css
/* Update these CSS variables */
--bg-navy: #0a0e2e;
--text-primary: #e8ecff;
--accent-lavender: #b8c5ff;
--text-secondary: #5a6490;
```

### Update Content

Edit `index.html`:
- Hero name and subtitle
- About bio
- Certifications
- Projects and tech stacks
- Contact info

### Replace Video

1. Export your video as MP4 (1920×1080 recommended)
2. Compress to WebM:
   ```bash
   ffmpeg -i your-video.mp4 -c:v libvpx-vp9 -b:v 1M -crf 30 -an output.webm
   ```
3. Place both files in `assets/videos/`
4. Update `index.html` `<video>` sources

## License

This portfolio is open source and available for personal use.

---

**Built with**: HTML5, CSS3, JavaScript (GSAP, Lenis), GitHub Pages
