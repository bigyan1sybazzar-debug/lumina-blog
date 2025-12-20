import React from 'react'
import { Head } from 'vite-react-ssg'

interface HeadProviderWrapperProps {
  children: React.ReactNode
}

// Simple SSG-safe wrapper
const HeadProviderWrapper: React.FC<HeadProviderWrapperProps> = ({ children }) => {
  return <>{children}</>
}

export default HeadProviderWrapper
