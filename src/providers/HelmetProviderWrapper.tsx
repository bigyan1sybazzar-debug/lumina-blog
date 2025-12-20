import React from 'react'
import HelmetPkg from 'react-helmet-async'

const { HelmetProvider } = HelmetPkg

const HelmetProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <HelmetProvider>{children}</HelmetProvider>
}

export default HelmetProviderWrapper
