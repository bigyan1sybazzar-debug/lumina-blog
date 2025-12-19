// src/index.tsx

import { ViteReactSSG } from 'vite-react-ssg'
import type { ViteReactSSGContext } from 'vite-react-ssg'
import type { RouteRecord } from 'vite-react-ssg'  // For stronger typing

import App from './App'
import { routes } from './App'  // routes exported from App.tsx
import './index.css'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

export const createApp = ViteReactSSG(
  // Root component (the function, NOT <App />)
 

  // Router options — assert the type to fix overload resolution
  { routes } as { routes: RouteRecord[] },

  // Typed client callback
  ({ isClient }: ViteReactSSGContext) => {
    if (isClient) {
      console.log('Bigyann.com.np: Hydration successful')
    }
  }
)