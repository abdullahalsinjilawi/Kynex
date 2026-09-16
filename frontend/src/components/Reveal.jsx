import useReveal from '../hooks/useReveal';

/**
 * بيظهر محتواه أول ما يوصله المستخدم بالتمرير. بنستخدمه بمكان واحد بس
 * (خطوات "كيف بتشتغل") — الحركة بتلفت النظر لما تكون نادرة، ولما تتكرر بكل قسم
 * بتصير ضجيج.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </div>
  );
}
