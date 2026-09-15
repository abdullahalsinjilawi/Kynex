import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import { formatRelativeTime } from '../utils/format';
import { avatarColorFor } from '../utils/avatarColor';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';

export default function Messages() {
  const { id } = useParams(); // conversationId (اختياري)
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadConversations = () => {
    apiClient
      .get('/messages/conversations')
      .then((res) => setConversations(res.data.conversations))
      .finally(() => setLoading(false));
  };

  const loadActiveConversation = () => {
    if (!id) return;
    apiClient.get(`/messages/conversations/${id}`).then((res) => {
      setActiveMessages(res.data.messages);
      setOtherUser(res.data.otherUser);
    });
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActiveConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // تحديث دوري بدل ما المستخدم يعيد تحميل الصفحة يدوياً حتى يشوف رسائل جديدة
  usePolling(loadConversations, 10000);
  usePolling(loadActiveConversation, 5000);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const res = await apiClient.post(`/messages/conversations/${id}`, { content: newMessage });
    setActiveMessages([...activeMessages, res.data.message]);
    setNewMessage('');
    loadConversations();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-5xl gap-4 px-4 py-6 sm:px-6">
      {/* قائمة المحادثات */}
      <div className={`w-full shrink-0 overflow-y-auto sm:w-72 ${id ? 'hidden sm:block' : ''}`}>
        <h1 className="mb-4 text-lg font-semibold">{t('messages.title')}</h1>
        {loading ? (
          <ListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <EmptyState icon="messages" title={t('messages.empty')} />
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => navigate(`/messages/${conv._id}`)}
                className={`flex items-center gap-3 rounded-lg p-2.5 text-start transition-colors ${
                  id === conv._id
                    ? 'bg-violet-500/10'
                    : 'hover:bg-ink-surface light:hover:bg-paper-surface'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${avatarColorFor(conv.otherUser?._id).bg} ${avatarColorFor(conv.otherUser?._id).text}`}>
                  {conv.otherUser?.name?.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{conv.otherUser?.name}</span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted light:text-paper-muted">
                    {conv.lastMessagePreview}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* المحادثة النشطة */}
      {id ? (
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-ink-border light:border-paper-border">
          <div className="flex items-center gap-2 border-b border-ink-border p-3 light:border-paper-border">
            <Link to="/messages" className="sm:hidden">
              ←
            </Link>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold ${avatarColorFor(otherUser?._id).bg} ${avatarColorFor(otherUser?._id).text}`}>
              {otherUser?.name?.charAt(0)}
            </span>
            <span className="text-sm font-medium">{otherUser?.name}</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {activeMessages.map((msg) => {
              const isMine = msg.sender === user?.id || msg.sender?._id === user?.id;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-violet-500 text-white'
                        : 'bg-ink-surface light:bg-paper-surface'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-ink-muted light:text-paper-muted'}`}>
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-ink-border p-3 light:border-paper-border">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('messages.messagePlaceholder')}
              className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
            <button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600">
              {t('common.send')}
            </button>
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
