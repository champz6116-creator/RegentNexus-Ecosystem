import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, User, MessageSquare, Inbox, ArrowLeft, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../api';

export default function MessagesPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- URL Param Parsing ---
  const recipientId = searchParams.get('recipientId') || searchParams.get('chatWith');
  const itemName = searchParams.get('itemName');
  const rawSellerName = searchParams.get('sellerName');
  const itemId = searchParams.get('itemId'); 

  // --- Core State Management Layers ---
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);

  // --- Custom Moderation Report Modal State ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Responsive state sync
  const [mobileShowChat, setMobileShowChat] = useState(!!recipientId);
  const messagesEndRef = useRef(null);

  // PERSISTENCE SHIELD: Protects socket lifecycle against double-mount re-instantiation drops
  const socketRef = useRef(null);
  const activeChatRef = useRef(activeChat);
  
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  // --- Helper Function: Bulletproof Array De-duplication ---
  const deduplicateMessages = (msgArray) => {
    return msgArray.filter((msg, index, self) => 
      msg._id ? self.findIndex(m => m._id === msg._id) === index : true
    );
  };

  // --- 🌟 SETUP REAL-TIME SOCKET CONNECTION (HYBRID LIVE lifecycle) ---
  useEffect(() => {
    if (!user || !user._id) return; 

    const targetSocketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://regent-nexus-backend.onrender.com';

    // Instance lock: isolates socket pipeline safely during component lifecycle
    if (!socketRef.current) {
      socketRef.current = io(targetSocketUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket']
      });
      
      socketRef.current.emit('join_room', user._id.toString());
      console.log(`🔌 Initialized fresh socket connection for user: ${user._id}`);
    }

    const socketInstance = socketRef.current;
    setSocket(socketInstance);

    // Dynamic stream safety check: drop matching hooks before re-binding
    socketInstance.off('receive_message');

    socketInstance.on('receive_message', (msg) => {
      const msgSenderId = (msg.sender?._id || msg.sender || '').toString();
      const msgRecipientId = (msg.recipient?._id || msg.recipient || '').toString();
      const currentUserId = user._id.toString();

      if (msgSenderId !== currentUserId && msgRecipientId !== currentUserId) {
        return; 
      }

      const targetPeerId = msgSenderId === currentUserId ? msgRecipientId : msgSenderId;
      
      const currentActiveChat = activeChatRef.current;
      const activeChatTargetId = currentActiveChat?.participant?._id?.toString() || currentActiveChat?._id?.toString();

      if (activeChatTargetId === targetPeerId || (currentActiveChat?._id === 'new_channel_context' && currentActiveChat?.participant?._id === targetPeerId)) {
        setMessages((prev) => {
          const normalizedMsg = {
            ...msg,
            sender: msg.isSystemAction ? 'system' : (msgSenderId === currentUserId ? 'me' : msgSenderId)
          };
          return deduplicateMessages([...prev, normalizedMsg]);
        });
      }

      setConversations((prev) => {
        const hasChatInSidebar = prev.some(c => c.participant?._id?.toString() === targetPeerId);

        if (!hasChatInSidebar && msgSenderId !== currentUserId) {
          const dynamicNewConversation = {
            _id: targetPeerId,
            participant: msg.sender && typeof msg.sender === 'object' ? msg.sender : {
              _id: targetPeerId,
              firstName: "New",
              lastName: "Trader"
            },
            contextItem: msg.contextItem || 'General Exchange',
            itemId: msg.itemId || null,
            text: msg.text,
            timestamp: msg.timestamp
          };
          return [dynamicNewConversation, ...prev];
        }

        const existingChat = prev.find(c => c.participant?._id?.toString() === targetPeerId);
        if (existingChat) {
          const updatedChat = { ...existingChat, text: msg.text, timestamp: msg.timestamp };
          return [updatedChat, ...prev.filter(c => c.participant?._id?.toString() !== targetPeerId)];
        }
        return prev;
      });
    });

    // LEAKPROOF CLEANUP PIPELINE: Fired cleanly on unmount or user shift
    return () => {
      socketInstance.off('receive_message');
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; // Clear pointer context entirely
        console.log("🔌 Component unmounted/shifted: Closed socket safely to protect server thread allocations.");
      }
    };
  }, [user?._id]); 

  // --- DATE & TIME FORMATTERS ---
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Sent';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'TODAY';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'TODAY';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleReportUserSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeChat || !reportReason.trim()) return;

    try {
      setSubmittingReport(true);
      await api.post('/messages/report', {
        reportedUserId: activeChat.participant?._id,
        itemId: activeChat.itemId || itemId,
        reason: reportReason.trim()
      });
      
      alert('Conversation flagged cleanly for safety evaluation.');
      setReportReason('');
      setShowReportModal(false);
    } catch (err) {
      console.error('Failed to submit moderation report logs:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  // --- Inbox Channel Syncer ---
  useEffect(() => {
    const fetchInboxChannels = async () => {
      const parsedSellerName = rawSellerName && rawSellerName !== 'undefined' 
      ? decodeURIComponent(rawSellerName) 
      : 'Campus Member';
      let backendChats = [];

      try {
        setLoadingChats(true);
        const { data } = await api.get('/messages/conversations');
        backendChats = data?.conversations || data || [];
        setConversations(backendChats);
      } catch (err) {
        console.warn("Failed to resolve communications lists:", err.message);
        setConversations([]);
      } finally {
        if (recipientId) {
          const matchingChat = backendChats.find(
            c => c.participant?._id === recipientId || c.participant?.id === recipientId
          );

          if (matchingChat) {
            setActiveChat(matchingChat);
          } else {
            const nameParts = parsedSellerName.split(' ');
            const fName = nameParts[0] !== 'undefined' ? nameParts[0] : 'User';
            const lName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            const contextItemValue = itemName ? decodeURIComponent(itemName) : '';

            setActiveChat({
              _id: 'new_channel_context',
              participant: { _id: recipientId, firstName: fName, lastName: lName },
              contextItem: contextItemValue || 'General Exchange',
              itemId: itemId || null
            });
            setMessages([]);

            if (contextItemValue) {
              setNewMessage(`Hi, I'm interested in your listed item: "${contextItemValue}". Is it still available?`);
            }
          }
          setMobileShowChat(true);
        } else if (backendChats.length > 0 && !activeChat) {
          setActiveChat(backendChats[0]);
        }
        setLoadingChats(false);
      }
    };

    fetchInboxChannels();
  }, [recipientId, itemName, rawSellerName, itemId]);

  // --- Message Log Stream Hook ---
  useEffect(() => {
    const fetchMessageLogs = async () => {
      if (!activeChat || !activeChat._id || activeChat._id === 'new_channel_context' || activeChat._id === 'system') {
        setMessages([]);
        return; 
      }
      try {
        setLoadingMessages(true);
        const { data } = await api.get(`/messages/channel/${activeChat._id}`);
        const rawHistory = data?.messages || data || [];
        setMessages(deduplicateMessages(rawHistory));
      } catch (err) {
        console.error('Failed to load historic channel transmission logs:', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessageLogs();
  }, [activeChat?._id]);

  const isChannelLocked = messages.some(m => m.isSystemAction && m.text && m.text.includes('no longer active'));

  // --- Dispatch Transmission Handlers ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat || isChannelLocked) return;

    const currentTypedString = newMessage.trim();

    try {
      if (activeChat._id === 'new_channel_context') {
        const payload = {
          recipientId: activeChat.participant._id,
          text: currentTypedString,
          contextItem: activeChat.contextItem,
          itemId: activeChat.itemId
        };

        const { data } = await api.post('/messages/initialize', payload);
        setNewMessage('');
        
        const finalizedChatId = data?.conversationId || data?._id || activeChat.participant._id;
        
        const structuralActiveChat = {
          _id: finalizedChatId,
          participant: activeChat.participant,
          contextItem: activeChat.contextItem,
          itemId: activeChat.itemId,
          text: currentTypedString,
          timestamp: new Date().toISOString()
        };

        const incomingMsg = data && data._id ? data : data.message;

        setActiveChat(structuralActiveChat);

        setConversations(prev => [
          structuralActiveChat, 
          ...prev.filter(c => c._id !== 'new_channel_context' && c.participant?._id !== activeChat.participant._id)
        ]);
        setMessages([{ ...incomingMsg, sender: 'me' }]);

      } else {
        const { data } = await api.post(`/messages/channel/${activeChat._id}/send`, {
          text: currentTypedString,
          contextItem: activeChat.contextItem,
          itemId: activeChat.itemId || itemId
        });

        const injectedMsg = (data && data._id) ? data : (data?.message && typeof data.message === 'object' ? data.message : data);
        
        setMessages(prev => deduplicateMessages([...prev, { ...injectedMsg, sender: 'me' }]));
        setNewMessage('');

        setConversations(prev => {
          const filtered = prev.filter(c => c._id !== activeChat._id);
          const updatedChat = {
            ...activeChat,
            text: currentTypedString,
            timestamp: new Date().toISOString()
          };
          return [updatedChat, ...filtered];
        });
      }
    } catch (err) {
      console.error('Failed to transmit chat message:', err);
    }
  };

  const handleCloseChatViewOnMobile = () => {
    setMobileShowChat(false);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2 sm:p-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex overflow-hidden shadow-xs relative">

        {/* Sidebar Panel */}
        <aside className={`w-full md:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/20 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h2 className="font-black text-sm tracking-tight flex items-center gap-2">
              <MessageSquare className="text-emerald-600 dark:text-emerald-500" size={16} />
              Ecosystem Chat Hub
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingChats ? (
              <div className="text-center text-[10px] uppercase font-bold tracking-widest py-8 text-slate-400">Loading channels...</div>
            ) : conversations.length === 0 && !recipientId ? (
              <div className="text-center text-xs py-12 text-slate-400 font-medium px-4 flex flex-col items-center justify-center gap-2">
                <Inbox size={20} className="opacity-50" />
                No active campus negotiations found.
              </div>
            ) : (
              conversations.map((chat) => {
                const isSelected = activeChat?._id === chat._id || 
                  (chat.participant?._id === recipientId && activeChat?._id === 'new_channel_context');
                return (
                  <button
                    key={chat._id}
                    onClick={() => {
                      setActiveChat(chat);
                      setMobileShowChat(true);
                    }}
                    className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition font-bold ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <User size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs truncate max-w-[70%]">{chat.participant?.firstName} {chat.participant?.lastName}</p>
                        {chat.timestamp && (
                          <span className={`text-[8px] font-medium shrink-0 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {formatTime(chat.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {chat.contextItem || 'General Exchange'}
                      </p>
                      {chat.text && (
                        <p className={`text-[10px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-50/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {chat.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Window Workspace */}
        <section className={`flex-1 flex flex-col bg-white dark:bg-slate-900 justify-between relative ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeChat ? (
            <>
              <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/10">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleCloseChatViewOnMobile}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:white bg-slate-100 dark:bg-slate-800 rounded-xl"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="min-w-0">
                    <h3 
                      className="font-black text-sm text-slate-900 dark:text-slate-50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer transition truncate inline-block"
                      onClick={() => navigate(`/peer/${activeChat.participant?._id || activeChat.participant?.id}`)}
                    >
                      {activeChat.participant?.firstName} {activeChat.participant?.lastName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5 truncate">
                      Regarding: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{activeChat.contextItem || 'General Exchange'}</span>
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowReportModal(true)}
                  className="flex flex-col items-center justify-center p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400/90 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shrink-0"
                  title="Report Abuse"
                >
                  <AlertTriangle size={18} />
                  <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">Report</span>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/5">
                {activeChat.contextItem && (
                  <div className="flex justify-center my-2">
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs border border-amber-200/40">
                      🏷️ Inquired Reference: {activeChat.contextItem}
                    </span>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Loading interaction stream...</div>
                ) : (
                  messages.map((msg, idx) => {
                    const msgSenderId = msg.senderId || msg.sender;
                    const isMe = msgSenderId === 'me' || (user?._id && msgSenderId === user._id);
                    const showDateLabel = idx === 0 || formatDateLabel(messages[idx - 1].timestamp || messages[idx - 1].createdAt) !== formatDateLabel(msg.timestamp || msg.createdAt);

                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDateLabel && (
                          <div className="flex justify-center my-3">
                            <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md shadow-xs">
                              {formatDateLabel(msg.timestamp || msg.createdAt)}
                            </span>
                          </div>
                        )}

                        {msg.isSystemAction ? (
                          <div className="flex justify-center my-2">
                            <div className={`max-w-[85%] rounded-xl px-4 py-2 text-xs font-bold text-center border ${
                              msg.isReportNotice 
                                ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ) : (
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] sm:max-w-[70%] rounded-2xl p-3 text-xs font-semibold shadow-xs leading-relaxed ${
                              isMe
                                ? 'bg-slate-900 text-white rounded-br-none dark:bg-slate-100 dark:text-slate-900'
                                : 'bg-white text-slate-800 border border-slate-150 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700/60 rounded-bl-none'
                            }`}>
                              <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                              <span className={`block text-[8px] mt-1 text-right font-medium ${isMe ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'}`}>
                                {formatTime(msg.timestamp || msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isChannelLocked}
                  placeholder={isChannelLocked ? "This listing channel is closed — Deactivated" : "Type your transaction message here..."}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-50 placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={isChannelLocked}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center shrink-0 shadow-xs disabled:bg-slate-400 dark:disabled:bg-slate-700"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShieldAlert size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wide">No Chat Selected</p>
              <p className="text-xs font-medium text-slate-400 max-w-xs mt-1">
                Select a talk stream from the sidebar channels panel to review ongoing discussions.
              </p>
            </div>
          )}

          {/* Report Modal */}
          {showReportModal && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="flex items-center justify-between text-rose-500 dark:text-rose-400">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">Refine Interaction Moderation Log</span>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Please specify any safety discrepancies or descriptive notes regarding this peer negotiation sequence for safety validation.
                </p>

                <form onSubmit={handleReportUserSubmit} className="space-y-3">
                  <textarea
                    rows={4}
                    maxLength={400}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Provide context regarding terms, communication, or transaction safety..."
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 outline-none placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition resize-none"
                    required
                  />
                  
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submittingReport || !reportReason.trim()}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs hover:bg-rose-500 transition disabled:opacity-50"
                    >
                      {submittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}