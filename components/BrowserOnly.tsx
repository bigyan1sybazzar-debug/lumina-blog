import React, { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

/**
 * Renders children **only in the browser**.
 * Useful for components that access `window` or `document`.
 */
export const BrowserOnly: React.FC<Props> = ({ children }) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) return null;
  return <>{children}</>;
};
