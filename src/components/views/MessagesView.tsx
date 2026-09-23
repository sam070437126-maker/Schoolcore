import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { DirectMessage } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  MessageSquare,
  Send,
  User,
  Check,
  CheckCheck,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  Paperclip,
  X,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { user, school, role, isTeacher, isParent, isAdmin, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activeRecipientId, setActiveRecipientId] = useState<string>('');
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // New message compose form
  const [composeData, setComposeData] = useState({
    recipient_id: '',
    recipient_name: '',
    recipient_role: 'TEACHER',
    subject: 'Academic Progress Inquiry',
    message: '',
  });

  const [schoolContacts, setSchoolContacts] = useState<Array<{ id: string; name: string; role: string; title: string }>>([]);

  useEffect(() => {
    loadMessages();
    loadContacts();
  }, [user?.id]);

  const loadContacts = async () => {
    try {
      const res = await api.getStaff();
      const staffList = (res.staff || []).map((s: any) => ({
        id: s.profile_id || s.id,
        name: s.profile?.full_name || s.name || 'Staff Member',
        role: s.role || 'TEACHER',
        title: s.designation || s.title || s.role || 'Faculty',
      })).filter((c: any) => c.id !== user?.id);
      setSchoolContacts(staffList);
    } catch {
      setSchoolContacts([]);
    }
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMessages();
      const list = res.messages || [];
      setMessages(list);

      // Auto select first conversation partner
      if (list.length > 0 && !activeRecipientId) {
        const firstPartnerId =
          list[0].sender_id === user?.id ? list[0].recipient_id : list[0].sender_id;
        setActiveRecipientId(firstPartnerId);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not load conversations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Group messages by contact partner
  const conversationsMap = new Map<string, { partnerId: string; partnerName: string; partnerRole: string; lastMsg: DirectMessage; unread: number }>();

  messages.forEach((m) => {
    const isMeSender = m.sender_id === user?.id;
    const partnerId = isMeSender ? m.recipient_id : m.sender_id;
    const partnerName = isMeSender ? m.recipient_name : m.sender_name;
    const partnerRole = isMeSender ? m.recipient_role : m.sender_role;

    const existing = conversationsMap.get(partnerId);
    const isUnread = !isMeSender && m.status !== 'READ';

    if (!existing) {
      conversationsMap.set(partnerId, {
        partnerId,
        partnerName,
        partnerRole,
        lastMsg: m,
        unread: isUnread ? 1 : 0,
      });
    } else {
      if (new Date(m.created_at).getTime() > new Date(existing.lastMsg.created_at).getTime()) {
        existing.lastMsg = m;
      }
      if (isUnread) existing.unread += 1;
    }
  });

  const conversationList = Array.from(conversationsMap.values());

  const activeThread = messages.filter(
    (m) =>
      (m.sender_id === user?.id && m.recipient_id === activeRecipientId) ||
      (m.sender_id === activeRecipientId && m.recipient_id === user?.id)
  );

  const activePartner = conversationList.find((c) => c.partnerId === activeRecipientId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeRecipientId) return;

    setIsSending(true);
    try {
      const partner = conversationList.find((c) => c.partnerId === activeRecipientId);
      const res = await api.sendMessage({
        recipient_id: activeRecipientId,
        recipient_name: partner?.partnerName || 'Recipient',
        recipient_role: partner?.partnerRole || 'USER',
        subject: activeThread[0]?.subject || 'Direct Communication',
        message: newMessageText.trim(),
      });

      setMessages((prev) => [...prev, res.data]);
      setNewMessageText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNewCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.recipient_id || !composeData.message.trim()) {
      showToast('Please select a recipient and enter a message.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendMessage({
        recipient_id: composeData.recipient_id,
        recipient_name: composeData.recipient_name,
        recipient_role: composeData.recipient_role,
        subject: composeData.subject,
        message: composeData.message.trim(),
      });

      showToast('Direct message dispatched successfully.', 'success');
      setShowComposeModal(false);
      setMessages((prev) => [...prev, res.data]);
      setActiveRecipientId(res.data.recipient_id);
      setComposeData({
        recipient_id: '',
        recipient_name: '',
        recipient_role: 'TEACHER',
        subject: 'Academic Progress Inquiry',
        message: '',
      });
    } catch (err: any) {
      showToast(err.message || 'Could not send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Parent-Teacher Direct Messaging</h1>
            <p className="text-xs text-slate-500">
              Encrypted, transparent communication channel between teachers, parents, and administrative leadership.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Direct Message</span>
        </button>
      </div>

      {/* Main Chat Layout: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[550px] bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Left Column: Conversations List */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent border-none outline-none w-full text-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-200/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : conversationList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No active conversations yet.</p>
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="mt-3 text-blue-600 font-semibold hover:underline"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              conversationList.map((conv) => {
                const isSelected = conv.partnerId === activeRecipientId;
                return (
                  <button
                    key={conv.partnerId}
                    onClick={() => setActiveRecipientId(conv.partnerId)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {conv.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{conv.partnerName}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMsg.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                        {conv.partnerRole}
                      </span>
                      <p className="text-[11px] text-slate-600 truncate mt-1">{conv.lastMsg.message}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Thread & Composer */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {activePartner ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    {activePartner.partnerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activePartner.partnerName}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-600">{activePartner.partnerRole}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ShieldCheck className="w-3 h-3" /> Official School Channel
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px]">
                {activeThread.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600">{isMe ? 'You' : msg.sender_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
                        }`}
                      >
                        {msg.subject && msg.subject !== 'Direct Communication' && (
                          <div className={`font-bold pb-1 text-[11px] ${isMe ? 'text-blue-100' : 'text-blue-900'}`}>
                            Sub: {msg.subject}
                          </div>
                        )}
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>

                      {isMe && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          {msg.status === 'READ' ? (
                            <span className="flex items-center gap-0.5 text-blue-600 font-semibold">
                              <CheckCheck className="w-3 h-3" /> Read
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Delivered
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${activePartner.partnerName}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessageText.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Select a Conversation</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Choose a parent or teacher from the list on the left to review message history or reply.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Compose New Message */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Compose Direct Message</h3>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNewCompose} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Contact *</label>
                <select
                  value={composeData.recipient_id}
                  onChange={(e) => {
                    const selected = schoolContacts.find((c) => c.id === e.target.value);
                    setComposeData({
                      ...composeData,
                      recipient_id: e.target.value,
                      recipient_name: selected?.name || '',
                      recipient_role: selected?.role || 'TEACHER',
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  required
                >
                  <option value="">-- Choose recipient from school directory --</option>
                  {schoolContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Line *</label>
                <input
                  type="text"
                  placeholder="e.g. Inquiring on Maths test performance"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  placeholder="Type your message clearly..."
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
