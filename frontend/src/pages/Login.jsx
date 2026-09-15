import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.user);

      if (res.data.accountPendingDeletion) {
        navigate('/settings?restore=1');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-xl font-semibold">{t('auth.login.title')}</h1>
      <p className="mb-6 text-sm text-ink-muted light:text-paper-muted">{t('auth.login.subtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('auth.email')}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-violet-500 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-60"
        >
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted light:text-paper-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="text-violet-400 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </div>
  );
}
