'use client'; // This marks it as a Client Component

import { useState, useEffect } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-96 w-full">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-muted-foreground">Loading CICD Stack Generator...</p>
  </div>
);

// We use a wrapper component because we can't use dynamic import with ssr: false directly
export default function CICDStackGeneratorWrapper() {
  // We'll use a state to defer import until the component is mounted (client-side)
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only import the component on the client side
    import('./cicd-stack-generator-impl').then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  // Show loading state until the component is loaded
  if (!Component) {
    return <LoadingSpinner />;
  }

  // Render the actual component once loaded
  return <Component />;
}
