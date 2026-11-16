import { useEffect, useState, type ReactNode } from 'react';
import { Laptop } from 'lucide-react';

// Smallest viewport width treated as a laptop screen (Tailwind's `lg` breakpoint).
export const MIN_SCREEN_WIDTH = 1024;

const query = `(min-width: ${MIN_SCREEN_WIDTH}px)`;

const isLargeEnough = () =>
  typeof window === 'undefined' || window.matchMedia(query).matches;

export const ScreenSizeGuard = ({ children }: { children: ReactNode }) => {
  const [allowed, setAllowed] = useState(isLargeEnough);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setAllowed(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <Laptop className="h-6 w-6 text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Use a laptop or desktop</h1>
        <p className="mt-2 text-sm text-gray-600">
          Premium G is built for larger screens. Open it on a laptop or desktop
          with a screen at least {MIN_SCREEN_WIDTH}px wide.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          On a laptop already? Maximise the browser window or zoom out.
        </p>
      </div>
    </div>
  );
};
