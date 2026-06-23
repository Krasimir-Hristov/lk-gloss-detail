# 🎨 Design Directory

This directory contains all design assets and exports from the **AI Auto Care Valuator** Stitch project.

## 📁 Structure

```
design/
├── DESIGN_SYSTEM.md        # Complete design system documentation
├── screens/                # HTML exports from Stitch
│   ├── contact-legal.html              # Contact form & legal pages
│   ├── admin-dashboard.html            # Admin control panel
│   ├── gallery-before-after.html       # Project gallery showcase
│   └── ai-valuation-service.html       # AI assessment workflow
└── assets/                 # Design reference images & screenshots
    ├── contact-legal.jpg
    ├── admin-dashboard.jpg
    ├── gallery-before-after.jpg
    ├── ai-valuation-service.jpg
    ├── hero-car-detailing.jpg          # Hero image reference
    ├── lk-logo.jpg                     # LK Gloss & Detail Logo
    ├── whatsapp-image-1.jpg            # Reference images
    ├── whatsapp-image-2.jpg
    └── whatsapp-image-3.jpg
```

## 🖼️ Public Screenshots

All screenshots are also available in `/public/screenshots/` for easy reference in the application.

## 🚀 Next Steps

1. **Extract Components**: Analyze HTML files to identify reusable components
2. **Convert to React**: Use Stitch MCP to generate React components
3. **Apply TypeScript**: Add strict typing to all components
4. **Integrate Styling**: Apply Tailwind CSS v4 with dark mode
5. **Connect Backend**: Link components to Supabase data layer
6. **Internationalization**: Apply next-intl for DE/EN/EL support

## 🎯 Component Conversion Guide

Each HTML file can be broken down into:

- **Header/Navigation**: Common navigation patterns
- **Forms**: Contact, assessment, admin forms
- **Cards**: Service, gallery, dashboard cards
- **Layouts**: Section containers, grids
- **Modals**: Dialog components for actions

## 📊 Design Specifications

- **Color System**: Material Design 3 (Dark Mode)
- **Typography**: Montserrat (Headlines) + Inter (Body)
- **Spacing**: 8px base unit system
- **Breakpoints**: Desktop 1280px, Mobile 512px
- **Components**: Shadcn/ui based

## 🔗 Resources

- **Stitch Project**: AI Auto Care Valuator
- **MCP Server**: Stitch integration enabled
- **Tech Stack**: Next.js 16 + React + TypeScript + Tailwind CSS v4

---

**Last Updated**: 2026-06-23  
**Status**: Ready for component extraction and React conversion
