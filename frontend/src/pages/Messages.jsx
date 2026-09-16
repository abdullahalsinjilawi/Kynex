import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import { formatRelativeTime } from '../utils/format';
import Avatar, { VerifiedMark } from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import FormError from '../components/FormError';
import { ListSkeleton } from '../components/Skeleton';

export default function Messages() {
  const { id } = useParams(); // conversationId (اختياري)
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [relatedProject, setRelatedProject] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const threadRef = useRef(null);
  const lastConversationId = useRef(null);

  const myId = String(user?.id || user?._id || '');

  const loadConversations = useCallback(() => {
    apiClient
      .get('/messages/conversations')
      .then((res) => setConversations(res.data.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadActiveConversation = useCallback(() => {
    if (!id) return;
    apiClient
      .get(`/messages/conversations/${id}`)
      .then((res) => {
        setActiveMessages(res.data.messages);
        setOtherUser(res.data.otherUser);
        setRelatedProject(res.data.relatedProject || null);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setActiveMessages([]);
    setError('');
    loadActiveConversation();
  }, [loadActiveConversation]);

  // التمرير للأسفل: أول ما تُفتح محادثة منقفز فوراً بدون حركة (ما بدنا رحلة تمرير
  // من فوق لتحت كل مرة)، وبعدين مع كل رسالة جديدة منمرّر بنعومة
  useEffect(() => {
    if (!activeMessages.length) return;
    const isNewThread = lastConversationId.current !== id;
    lastConversationId.current = id;

    const container = threadRef.current;
    if (!container) return;

    if (isNewThread) {
      container.scrollTop = container.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeMessages, id]);

  // تحديث دوري بدل ما المستخدم يعيد تحميل الصفحة يدوياً حتى يشوف رسائل جديدة
  usePolling(loadConversations, 10000);
  usePolling(loadActiveConversation, 5000);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setError('');
    try {
      const res = await apiClient.post(`/messages/conversations/${id}`, { content });
      // منضيف الرسالة محلياً بدل ما نستنى دورة الـ polling الجاية (٥ ثواني حسّ بطيء)،
      // ومنتأكد ما نكرّرها لو كان الـ polling سبقنا وجابها أصلاً
      setActiveMessages((prev) =>
        prev.some((m) => m._id === res.data.message._id) ? prev : [...prev, res.data.message]
      );
      setNewMessage('');
      loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || t('messages.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-page-in mx-auto flex h-[calc(100dvh-9rem)] max-w-6xl gap-4 px-4 py-6 sm:px-6">
      {/* قائمة المحادثات — بالموبايل بتختفي لما تفتح محادثة (شاشة وحدة بنفس الوقت) */}
      <div className={`flex w-full shrink-0 flex-col sm:w-80 ${id ? 'hidden sm:flex' : ''}`}>
        <h1 className="mb-4 font-display text-xl font-bold tracking-tight">{t('messages.title')}</h1>

        <div className="min-h-0 flex-1 overflow-y-auto pe-1">
          {loading ? (
            <ListSkeleton count={5} />
          ) : conversations.length === 0 ? (
            <EmptyState icon="messages" title={t('messages.empty')} description={t('messages.emptyHint')} />
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => navigate(`/messages/${conv._id}`)}
                  aria-current={id === conv._id ? 'true' : undefined}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-start transition-colors ${
                    id === conv._id ? 'border-brand/40 bg-brand/12' : 'border-transparent hover:bg-fg/5'
                  }`}
                >
                  <Avatar name={conv.otherUser?.name} id={conv.otherUser?._id} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-sm font-medium">{conv.otherUser?.name}</span>
                        {conv.otherUser?.verified && (
                          <VerifiedMark className="h-3.5 w-3.5" title={t('common.verified')} />
                        )}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white tnum">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">{conv.lastMessagePreview}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* المحادثة النشطة */}
      {id ? (
        <div className="panel flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line bg-elevated/60 px-3 py-2.5">
            <Link to="/messages" className="icon-btn h-9 w-9 sm:hidden" aria-label={t('messages.back')}>
              {/* السهم بينقلب مع اتجاه الصفحة: بالعربي بيشاور يمين، بالإنجليزي يسار */}
              <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>

            {otherUser?._id ? (
              <Link to={`/profile/${otherUser._id}`} className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-brand-light">
                <Avatar name={otherUser?.name} id={otherUser?._id} size="sm" />
                <span className="truncate text-sm font-medium">{otherUser?.name}</span>
                {otherUser?.verified && <VerifiedMark className="h-3.5 w-3.5" title={t('common.verified')} />}
              </Link>
            ) : (
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={otherUser?.name} id={null} size="sm" />
                <span className="truncate text-sm font-medium text-muted">{otherUser?.name}</span>
              </span>
            )}

            {relatedProject?.slug && (
              <Link
                to={`/project/${relatedProject.slug}`}
                className="ms-auto hidden max-w-[40%] truncate rounded-lg border border-line px-2 py-1 text-xs text-muted transition-colors hover:text-fg sm:block"
              >
                {relatedProject.name}
              </Link>
            )}
          </div>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {activeMessages.map((msg) => {
              const senderId = String(msg.sender?._id || msg.sender || '');
              const isMine = myId && senderId === myId;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed ${
                      isMine
                        ? 'rounded-2xl rounded-ee-md bg-gradient-to-br from-brand to-brand-strong text-white'
                        : 'rounded-2xl rounded-es-md border border-line bg-elevated'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words" dir="auto">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-muted'}`}>
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-line p-3">
            {error && <FormError>{error}</FormError>}
            <div className="flex gap-2">
              <input
                dir="auto"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder={t('messages.messagePlaceholder')}
                aria-label={t('messages.messagePlaceholder')}
                maxLength={2000}
                className="input input-sm flex-1"
              />
              <button type="submit" disabled={sending || !newMessage.trim()} className="btn btn-primary btn-sm shrink-0">
                {t('common.send')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center sm:flex">
          <EmptyState icon="messages" title={t('messages.selectConversation')} />
        </div>
      )}
    </div>
  );
}
