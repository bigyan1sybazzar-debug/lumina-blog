import React from 'react'
import { createHead, UnheadProvider } from '@unhead/react'

// Create a head instance
const head = createHead()

const HeadProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <UnheadProvider head={head}>{children}</UnheadProvider>
}

export default HeadProviderWrapper
