import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * حقل كلمة سر مع زر إظهار/إخفاء. السبب: على الموبايل الكتابة بالعمى أكبر سبب
 * لفشل تسجيل الدخول، وزر الإظهار بيحل المشكلة بدون ما يضرّ الأمان (المستخدم
 * هو اللي بيقرر).
 */
export default function PasswordInput({ label, value, onChange, autoComplete, minLength, placeholder, hint, required = true }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input pe-12"
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-fg"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {visible ? (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8" />
              <path d="M7.4 7.5C4.9 9 3 12 3 12s3.5 6 9 6c1.6 0 3-.4 4.2-1M19.4 15.4C20.5 14.2 21 12 21 12s-3.5-6-9-6c-.7 0-1.4.1-2 .3" />
            </svg>
          ) : (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
              <circle cx="12" cy="12" r="2.6" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
