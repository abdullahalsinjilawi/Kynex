/** مؤشر تحميل صغير — بنستخدمه جوّا الأزرار وقت الإرسال. */
export default function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
