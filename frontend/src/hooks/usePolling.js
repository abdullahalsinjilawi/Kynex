import { useEffect, useRef } from 'react';

// بينفذ callback كل delay ميلي ثانية، وبيوقف تلقائياً لما المكوّن يختفي
export default function usePolling(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
