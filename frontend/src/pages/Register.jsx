import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError(t('auth.register.mustAcceptTerms'));
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, acceptedTerms });
      // ما فيه خطوة تفعيل — الباك اند بيرجع اليوزر موصول (كوكي الجلسة انحطت مباشرة)
      login(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-xl font-semibold">{t('auth.register.title')}</h1>
      <p className="mb-6 text-sm text-ink-muted light:text-paper-muted">{t('auth.register.subtitle')}</p>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('auth.register.name')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('auth.password')}
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.register.passwordPlaceholder')}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-muted light:text-paper-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          <span>
            {t('auth.register.agreeTo')}{' '}
            <Link to="/terms" className="text-violet-400 hover:underline">
              {t('auth.register.terms')}
            </Link>
          </span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-violet-500 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-60"
        >
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted light:text-paper-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-violet-400 hover:underline">
          {t('auth.register.login')}
        </Link>
      </p>
    </div>
  );
}
