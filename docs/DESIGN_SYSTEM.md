# Wedding Site Design System

## Overview

This document summarizes the premium design system implemented for the wedding RSVP platform. The design achieves an "invite-grade" aesthetic while maintaining excellent accessibility and performance.

## Color Palette

The warm, elegant color palette uses neutral tones appropriate for a wedding celebration:

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6b5c4c` | Main text, headings, buttons |
| Primary Dark | `#4a3f35` | Button hover states |
| Accent | `#a89076` | Links, focus rings, decorative elements |
| Cream | `#faf9f7` | Background, subtle fills |
| Warm Gray | `#7a7068` | Secondary text, labels |
| Soft Border | `#e5e0db` | Input borders, dividers |
| Success | `#5c7c5f` | Success states, confirmations |
| Error | `#a85454` | Error states, danger actions |

## Typography

### Font Pairing
- **Headings**: Cormorant Garamond (serif) - elegant, formal feel
- **Body**: Inter (sans-serif) - clean, modern readability

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
```

### Usage
- All `<h1>`, `<h2>`, `<h3>` automatically use Cormorant Garamond
- Add `.font-serif` class for other serif elements
- Body text defaults to Inter

## Component Classes

### Buttons

**Primary Button** (`.btn-primary`)
- Used for main CTAs (Submit RSVP, Edit, etc.)
- Dark primary color with white text
- Hover darkens background

**Secondary Button** (`.btn-secondary`)
- Used for secondary actions
- White background with primary text
- Border with subtle hover effect

**Danger Button** (`.btn-danger`)
- Used for destructive actions (Remove, Cancel, etc.)
- Error color background

### Inputs

**Standard Input** (`.input`)
- Full width with generous padding
- Soft border with hover highlight
- Focus ring using accent color
- Smooth transitions

### Cards

**Card Container** (`.card`)
- White background
- Subtle shadow and border
- Rounded corners (0.5rem)
- Comfortable padding (1.5rem)

## Layout Patterns

### Page Structure
- Max-width container: `max-w-4xl mx-auto`
- Page padding: `px-4 py-8`
- Section spacing: `py-12`

### Header
- Sticky with backdrop blur
- Border-bottom separator
- Centered navigation with hover states

### Footer
- Full-width with subtle background
- Centered text
- Border-top separator

### Hero Section (Home)
- Full viewport height (60vh mobile, 70vh desktop)
- Gradient overlay for text readability
- Fallback gradient when no image

## Page Designs

### Home Page
1. Full-bleed hero with couple names and date
2. Welcome section with elegant typography
3. Quick links cards (RSVP, Travel, Gallery)
4. Gallery preview grid

### RSVP Page
- Centered card container (`max-w-xl`)
- Elegant heading with serif font
- Well-spaced form sections
- Success/error states with icons
- Collapsible token management section

### Travel Page
- Icon-enhanced sections
- Card-based information blocks
- Responsive accommodation grid

### Gallery Page
- Responsive image grid
- Hover effects with subtle scale
- Lazy loading for performance

## Accessibility

- All interactive elements have visible focus states
- Color contrast meets WCAG AA standards
- Reduced motion support via `prefers-reduced-motion`
- Proper label associations for form inputs
- ARIA attributes where needed

## CSS Custom Properties

Defined in `:root` for easy theming:
```css
:root {
  --color-primary: #6b5c4c;
  --color-primary-dark: #4a3f35;
  --color-accent: #a89076;
  --color-cream: #faf9f7;
  --color-warm-gray: #7a7068;
  --color-soft-border: #e5e0db;
  --color-success: #5c7c5f;
  --color-error: #a85454;
}
```

## Files Modified

1. `styles/globals.css` - Design tokens and utility classes
2. `tailwind.config.cjs` - Extended theme configuration
3. `src/app/layout.tsx` - Root layout with header/footer
4. `src/components/Header.tsx` - Navigation styling
5. `src/app/page.tsx` - Home page redesign
6. `src/components/HeroImageServer.tsx` - Hero styling
7. `src/components/GalleryServer.tsx` - Gallery grid
8. `src/app/rsvp/page.tsx` - RSVP page wrapper
9. `src/components/RSVPForm.tsx` - Form styling
10. `src/app/travel/page.tsx` - Travel page redesign
11. `src/app/gallery/page.tsx` - Gallery page redesign
12. `src/components/AddGuestModal.tsx` - Modal styling
13. `src/components/toast/ToastContainer.tsx` - Toast styling

## Test Status

- **22 unit tests** - All passing
- **6 E2E tests** - All passing
- **Build** - Successful
