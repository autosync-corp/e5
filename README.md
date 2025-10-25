# E5 Wheels - Vue + Vite + TypeScript Application

Modern Vue 3 application built with Vite and TypeScript, featuring the E5 Wheels homepage design for exclusive Corvette wheels.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **TypeScript** - Type-safe JavaScript
- **Vue Router** - Official routing solution
- **Google Fonts** - Libre Franklin & Work Sans

## Project Setup

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:8080`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
autosync_efive/
├── src/
│   ├── assets/
│   │   ├── images/          # Design assets from Figma
│   │   └── videos/          # Video assets
│   ├── components/          # Reusable Vue components
│   ├── router/
│   │   └── index.ts         # Vue Router configuration
│   ├── views/
│   │   └── HomePage.vue     # Main home page component (TS)
│   ├── App.vue              # Root component
│   └── main.ts              # Application entry point (TS)
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Features

- ✅ **Vite** - Lightning fast HMR and build times
- ✅ **TypeScript** - Full type safety across the application
- ✅ **Vue 3 Composition API** - Modern `<script setup>` syntax
- ✅ **Responsive Design** - Optimized for the E5 Wheels brand
- ✅ **Vue Router** - SPA navigation
- ✅ **Asset Optimization** - Vite handles all asset bundling
- ✅ **Google Fonts** - Custom font loading

## Development

The HomePage component (`src/views/HomePage.vue`) uses:
- TypeScript with `<script setup lang="ts">`
- Vite's static asset imports for images and videos
- Scoped styles for component isolation
- Vue 3 Composition API with lifecycle hooks

## Asset Management

All assets are imported using Vite's static asset handling:
```typescript
import logo from '@/assets/images/logo.png'
import video from '@/assets/videos/hero.mp4'
```

Vite automatically optimizes and bundles these assets during build.

## Notes

- Hero video is located at `src/assets/videos/E5LPVID-.mp4`
- All Figma design assets are in `src/assets/images/`
- Fonts are loaded via Google Fonts CDN (Libre Franklin & Work Sans)
- TypeScript strict mode is enabled for better type safety

## Browser Support

Modern browsers with ES2020+ support.

---

**Built with ❤️ using Vue 3 + Vite + TypeScript**
