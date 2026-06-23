# LK Gloss & Detail - Design System

**Project**: AI Auto Care Valuator  
**Design Tool**: Stitch (Google)  
**Last Updated**: 2026-06-23  
**Status**: Ready for React Component Conversion

---

## 🎨 Design Theme

### Color Palette

- **Primary**: #d1bcff (Light Purple)
- **Primary Container**: #7b2dff (Vibrant Purple - Main Brand)
- **Secondary**: #ebb2ff (Pink Purple)
- **Secondary Container**: #b303f2 (Deep Purple)
- **Tertiary**: #dbb8ff (Soft Purple)
- **Surface**: #131313 (Deep Black)
- **Surface Bright**: #393939 (Dark Gray)
- **On-Surface**: #e5e2e1 (Light Text)
- **Error**: #ffb4ab (Light Red)

### Typography

- **Headlines**: Montserrat (Bold 600-800)
  - Display LG: 64px, 800 weight
  - Headline LG: 40px, 700 weight
  - Headline MD: 24px, 600 weight
- **Body**: Inter (Regular 400)
  - Body LG: 18px
  - Body MD: 16px
- **Labels**: Inter (Bold 700)
  - Label Caps: 12px, 0.1em letter-spacing

### Spacing

- **Base Unit**: 8px
- **Gutter**: 24px
- **Margin (Desktop)**: 64px
- **Margin (Mobile)**: 16px
- **Section Gap**: 120px
- **Container Max**: 1280px

### Components

- **Roundness**: ROUND_FOUR (Medium rounded corners)
- **Spacing Scale**: 2x

---

## 📱 Screen Inventory

### Desktop Screens with HTML Exports

#### 1. Contact & Legal

- **File**: `screens/contact-legal.html` ✓
- **Screenshot**: `assets/contact-legal.jpg`
- **Size**: 2560x4240px
- **Purpose**: Contact form, legal information, footer
- **Status**: HTML ready for conversion

#### 2. Admin Dashboard

- **File**: `screens/admin-dashboard.html` ✓
- **Screenshot**: `assets/admin-dashboard.jpg`
- **Size**: 2560x2212px
- **Purpose**: Admin panel for appointments, services, analytics
- **Status**: HTML ready for conversion

#### 3. Gallery - Before & After

- **File**: `screens/gallery-before-after.html` ✓
- **Screenshot**: `assets/gallery-before-after.jpg`
- **Size**: 2560x5990px
- **Purpose**: Showcase before/after project images
- **Status**: HTML ready for conversion

#### 4. AI Valuation - Service Selection

- **File**: `screens/ai-valuation-service.html` ✓
- **Screenshot**: `assets/ai-valuation-service.jpg`
- **Size**: 2560x2792px
- **Purpose**: Step-by-step car assessment and service selection
- **Status**: HTML ready for conversion

#### 5. AI Valuation - Result Report

- **File**: `screens/result-report.html` ✓
- **Screenshot**: `assets/result-report.jpg`
- **Size**: 2560x3804px
- **Purpose**: Final assessment results and recommendations
- **Status**: HTML ready for conversion

### Desktop Screens (Screenshot Only)

#### 6. AI Valuation - Upload Stage

- **Screenshot**: `assets/upload-stage.jpg`
- **Size**: 2560x3018px
- **Purpose**: Image upload interface for car assessment
- **Status**: Screenshot available, HTML pending

#### 7. Homepage - LK Gloss & Detail

- **Screenshot**: `assets/homepage.jpg`
- **Size**: 2560x7034px
- **Purpose**: Main landing page with hero section and services overview
- **Status**: Screenshot available, HTML pending

---

## 🖼️ Assets & Images

### Reference Images

- **WhatsApp Image 1**: `assets/whatsapp-image-1.jpg` (943x2048px)
- **WhatsApp Image 2**: `assets/whatsapp-image-2.jpg` (943x2048px)
- **WhatsApp Image 3**: `assets/whatsapp-image-3.jpg` (943x2048px)
- **Hero - Car Detailing**: `assets/hero-car-detailing.jpg` (1376x768px)
  - Description: High-end car detailing, black luxury sports car (Porsche/Audi), professional orbital buffer, reflective paint, purple neon workshop lights
- **LK Logo**: `assets/lk-logo.jpg` (1024x1024px)

---

## 🎯 Conversion Roadmap

### Phase 1: Component Extraction

- [ ] Extract reusable components from HTML
- [ ] Create component hierarchy
- [ ] Identify shared patterns

### Phase 2: React Component Generation

- [ ] Convert HTML to React components
- [ ] Apply TypeScript typing
- [ ] Integrate with Next.js 16

### Phase 3: Styling & Theming

- [ ] Apply Tailwind CSS v4
- [ ] Implement dark mode
- [ ] Create Tailwind config with design tokens

### Phase 4: Interactivity

- [ ] Add form handling (React Hook Form)
- [ ] Implement animations (Framer Motion)
- [ ] Server Actions integration

### Phase 5: Integration

- [ ] Connect to Supabase (Auth, Database)
- [ ] Implement i18n (next-intl)
- [ ] Setup SSR & streaming

---

## 📐 Component Patterns

### Layout Components

- Container (max-width: 1280px)
- Header with navigation
- Hero section
- Section wrapper (120px gap)
- Footer

### Form Components

- Input fields (with validation)
- Select dropdowns
- Checkboxes
- Buttons (primary, secondary)
- Form sections

### Card Components

- Image card (before/after)
- Service card
- Dashboard card
- Info card

### Navigation Components

- Main navigation bar
- Breadcrumbs
- Tabs
- Sidebar menu

---

## 🔗 References

- **Project Location**: `/design/`
- **Screenshots**: `/public/screenshots/`
- **HTML Exports**: `/design/screens/`
- **Assets**: `/design/assets/`
- **Next Steps**: Convert HTML to React components using Stitch MCP

---

## 📝 Notes

- All colors use Material Design 3 color system
- Supports dark mode by default
- Responsive design (Desktop + Mobile)
- Accessibility considerations included
- Ready for component library generation
