import { useEffect, useRef } from 'react';

/**
 * بترجع ref بتحطه على أي عنصر فيه كلاس "reveal" — أول ما يوصله المستخدم بالتمرير
 * بيظهر مرة وحدة وبس (منوقف المراقبة بعدها، ما في داعي نضل نحسب).
 * لو المتصفح ما بيدعم IntersectionObserver، العنصر بيبان مباشرة.
 */
export default function useReveal(options) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      element.dataset.visible = 'true';
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.dataset.visible = 'true';
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
