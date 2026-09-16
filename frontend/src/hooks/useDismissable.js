import { useEffect } from 'react';

/**
 * سلوك النوافذ المنبثقة (modal) الموحّد:
 * 1. زرّ Escape بيسكّر — بدونه المستخدم لازم يلاقي زر الإغلاق بالفارة.
 * 2. قفل تمرير الصفحة الخلفية — بدونه لما تمرّر داخل النافذة بتلاقي الصفحة اللي
 *    وراها ماشية معك وبترجع لمكان تاني لما تسكّر.
 *
 * منحفظ overflow الأصلي ونرجّعه متل ما كان بدل ما نفرض 'auto'، لأنه ممكن يكون
 * في أكتر من نافذة مفتوحة فوق بعض.
 */
export default function useDismissable(onClose) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
}
