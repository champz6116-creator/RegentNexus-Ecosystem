import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, User, MessageSquare, Inbox, ArrowLeft, ShieldAlert } from 'lucide-react';
import api from '../../api';

export default function MessagesPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- URL Param Parsing ---
  const recipientId = searchParams.get('recipientId') || searchParams.get('chatWith');
  const itemName = searchParams.get('itemName');
  const rawSellerName = searchParams.get('sellerName');

  // --- Core State Management Layers ---
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Responsive state sync
  const [mobileShowChat, setMobileShowChat] = useState(!!recipientId);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  // --- Hook 1: Core Inbox Sync Pipeline ---
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
          // Look for an existing negotiation path matching the targeted student
          const matchingChat = backendChats.find(
            c => c.participant?._id === recipientId || c.participant?.id === recipientId
          );

          if (matchingChat) {
            setActiveChat(matchingChat);
          } else {
            // Build an active workspace context layer placeholder for uninitiated sessions
            const nameParts = parsedSellerName.split(' ');
            // Use a more robust check to ensure you aren't defaulting to "Campus" too easily
            const fName = nameParts[0] !== 'undefined' ? nameParts[0] : 'User';
            const lName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            const contextItemValue = itemName ? decodeURIComponent(itemName) : '';

            setActiveChat({
              _id: 'new_channel_context',
              participant: { _id: recipientId, firstName: fName, lastName: lName },
              contextItem: contextItemValue || 'Marketplace Item'
            });
            setMessages([]);

            // Auto-populate context greeting frame cleanly if it hasn't been edited
            if (contextItemValue) {
              setNewMessage(`Hi, I'm interested in your listed item: "${contextItemValue}". Is it still available?`);
            }
          }
          setMobileShowChat(true);
        } else if (backendChats.length > 0 && !activeChat) {
          // Only auto-select the first channel if there isn't an active layout already targeted
          setActiveChat(backendChats[0]);
        }
        setLoadingChats(false);
      }
    };

    fetchInboxChannels();
    // 💡 REMOVED activeChat from dependencies to kill infinite state cycles
  }, [recipientId, itemName, rawSellerName]);

  // --- Hook 2: Direct Feed Message Log Updates ---
  useEffect(() => {
    const fetchMessageLogs = async () => {
      if (!activeChat || activeChat._id === 'new_channel_context') {
        return; 
      }
      try {
        setLoadingMessages(true);
        const { data } = await api.get(`/messages/channel/${activeChat._id}`);
        setMessages(data?.messages || data || []);
      } catch (err) {
        console.error('Failed to load historic channel transmission logs:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessageLogs();
  }, [activeChat?._id]); // 💡 Safely tie dependency to primitive ID changes only

  // --- Dispatch Transmission Handlers ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const currentTypedString = newMessage.trim();

    try {
      if (activeChat._id === 'new_channel_context') {
        const payload = {
          recipientId: activeChat.participant._id,
          text: currentTypedString,
          contextItem: activeChat.contextItem
        };

        const { data } = await api.post('/messages/initialize', payload);
        setNewMessage('');
        
        const finalizedChatId = data?.message?.conversationId || data?.conversation?._id || data?.chatId;
        const structuralActiveChat = {
          ...activeChat,
          _id: finalizedChatId || 'fallback_routing_id'
        };

        setActiveChat(structuralActiveChat);
        setConversations(prev => [structuralActiveChat, ...prev.filter(c => c._id !== 'new_channel_context')]);
        
        // Pull down message array directly returned by server initialization step
        if (data?.message) setMessages([data.message]);
      } else {
        const { data } = await api.post(`/messages/channel/${activeChat._id}/send`, {
          text: currentTypedString,
          recipientId: activeChat.participant._id,
          contextItem: activeChat.contextItem
        });

        const injectedMsg = data?.message || data;
        setMessages(prev => [...prev, injectedMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to transmit chat message:', err);
    }
  };

  const handleCloseChatViewOnMobile = () => {
    setMobileShowChat(false);
    // Remove query search contexts without causing full component reboots
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2 sm:p-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex overflow-hidden shadow-2xs relative">

        {/* --- Sidebar Channel Threads Matrix --- */}
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
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <User size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{chat.participant?.firstName} {chat.participant?.lastName}</p>
                      <p className={`text-[10px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {chat.contextItem || 'General Exchange'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* --- Main Chat Dialog Stream Workspace Window --- */}
        <section className={`flex-1 flex flex-col bg-white dark:bg-slate-900 justify-between ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeChat ? (
            <>
              {/* Header Profile Info Meta Bar */}
              <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/30 dark:bg-slate-950/10">
                <button
                  onClick={handleCloseChatViewOnMobile}
                  className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="flex-1 min-w-0">
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
              </header>

              {/* Message History Feed Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/5">
                {loadingMessages ? (
                  <div className="text-center text-[10px] uppercase font-bold text-slate-400 py-6 tracking-wider">Syncing message histories...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs py-8 text-slate-400 font-medium max-w-xs mx-auto">
                    Say hello! Initiate negotiations cleanly regarding safe campus drop-off zones or item trading adjustments.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const msgSenderId = msg.senderId || msg.sender;
                    
                    // Fixed logical boundary structure evaluation: prevents false owner assignments
                    const isMe = msgSenderId === 'me' || 
                      (user?._id && msgSenderId === user._id) || 
                      (msgSenderId && msgSenderId !== activeChat.participant?._id);

                    return (
                      <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] sm:max-w-[70%] rounded-2xl p-3 text-xs font-semibold shadow-2xs leading-relaxed ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-none dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-white text-slate-800 border border-slate-150 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700/60 rounded-bl-none'
                        }`}>
                          <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                          <span className={`block text-[8px] mt-1 text-right font-medium ${isMe ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Secure Input Form Block */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your transaction message here safety parameters..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-50 placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
                />
                <button type="submit" className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center shrink-0 shadow-2xs">
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
        </section>

      </div>
    </div>
  );
}
