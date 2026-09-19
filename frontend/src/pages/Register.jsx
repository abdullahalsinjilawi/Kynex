import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import FormError from '../components/FormError';
import Spinner from '../components/Spinner';

/** مؤشر قوة بسيط: طول كلمة السر + تنوّع المحارف. هدفه يوجّه، مش يمنع. */
function strengthOf(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 3);
}

export default function Register() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);
  const strengthLabels = [
    t('auth.register.strength.weak'),
    t('auth.register.strength.fair'),
    t('auth.register.strength.good'),
    t('auth.register.strength.strong'),
  ];

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError(t('auth.register.mustAcceptTerms'));
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        username,
        email,
        password,
        acceptedTerms,
      });
      // ما فيه خطوة تفعيل — الباك اند بيرجع المستخدم موصول (كوكي الجلسة انحطت مباشرة)
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="link-brand font-medium">
            {t('auth.register.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="field-label" htmlFor="register-name">
            {t('auth.register.name')}
          </label>
          <input
            id="register-name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="input"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="register-username">
            {t('auth.register.username')}
          </label>
          <input
            id="register-username"
            type="text"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder={t('auth.register.usernamePlaceholder')}
            autoComplete="username"
            dir="ltr"
            pattern="[a-z0-9_-]{3,30}"
            className="input"
          />
          <p className="mt-1.5 text-xs text-muted">{t('auth.register.usernameHint')}</p>
        </div>

        <div>
          <label className="field-label" htmlFor="register-email">
            {t('auth.email')}
          </label>
          <input
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            className="input"
          />
        </div>

        <div>
          <PasswordInput
            label={t('auth.password')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            placeholder={t('auth.register.passwordPlaceholder')}
          />

          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= strength
                        ? strength === 0
                          ? 'bg-danger'
                          : strength < 3
                            ? 'bg-gold'
                            : 'bg-success'
                        : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">{strengthLabels[strength]}</span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span>
            {t('auth.register.agreeTo')}{' '}
            <Link to="/terms" className="link-brand">
              {t('auth.register.terms')}
            </Link>
          </span>
        </label>

        <FormError>{error}</FormError>

        <button type="submit" disabled={loading} className="btn btn-primary mt-1 w-full">
          {loading && <Spinner />}
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
