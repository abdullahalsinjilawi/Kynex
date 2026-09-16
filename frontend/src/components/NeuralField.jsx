import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { createNeuralField } from '../webgl/neuralField';

/**
 * غلاف React لحقل العُقد. المنطق كله بـ src/webgl — هون بس دورة حياة الكانفس.
 * لو المتصفح ما بيدعم WebGL2، createNeuralField بترجع null وبيضل التدرّج اللي
 * ورا الكانفس هو الخلفية — يعني ما فيه حالة "مربع أسود فاضي" أبداً.
 */
export default function NeuralField({ className = '', density = 1, pointer = true }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let field = null;
    // منأجّل التهيئة فريم واحد حتى النص والأزرار يطلعوا أول شي — الخلفية مالها أولوية
    const handle = requestAnimationFrame(() => {
      field = createNeuralField(canvas, { theme, density, pointer });
    });

    return () => {
      cancelAnimationFrame(handle);
      if (field) field.destroy();
    };
  }, [theme, density, pointer]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full ${className}`}
    />
  );
}
