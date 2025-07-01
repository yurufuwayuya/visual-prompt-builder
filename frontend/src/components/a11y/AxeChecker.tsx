import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let axeCore: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ReactDOM: any;

if (import.meta.env.DEV) {
  import('@axe-core/react').then((module) => {
    axeCore = module.default;
    import('react-dom').then((module) => {
      ReactDOM = module.default;
    });
  });
}

export function AxeChecker({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (import.meta.env.DEV && axeCore && ReactDOM) {
      axeCore(React, ReactDOM, 1000);
    }
  }, []);

  return <>{children}</>;
}