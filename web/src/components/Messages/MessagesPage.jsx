import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User, MessageSquare, ShieldCheck, Inbox } from 'lucide-react';
import api from '../../api';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('recipientId');
  const itemName = searchParams.get('itemName');

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchInbox();
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync active communication data logs
  const fetchInbox = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/messages/conversations');
      const backendChats = data || [];
      setConversations(backendChats);

      // Check URL search constraints for contextual marketplace handshakes
      if (recipientId) {
        const matchingChat = backendChats.find(c => c.participant?._id === recipientId);
        
        if (matchingChat) {
          setActiveChat(matchingChat);
          fetchMessages(matchingChat._id);
        } else {
          // Generate a clean placeholder channel instance if this is a first-time inquiry
          const newPlaceholder = {
            _id: 'new_channel_context',
            participant: { _id: recipientId, firstName: 'Campus', lastName: 'Member' },
            contextItem: itemName ? decodeURIComponent(itemName) : 'Marketplace Item'
          };
          setActiveChat(newPlaceholder);
          setMessages([]);
          
          if (itemName) {
            setNewMessage(`Hi, I'm interested in your listed item: "${decodeURIComponent(itemName)}". Is it still available?`);
          }
        }
      } else if (backendChats.length > 0) {
        setActiveChat(backendChats[0]);
        fetchMessages(backendChats[0]._id);
      }
    } catch (err) {
      console.error("Could not sync chat channel records:", err);
      setupMockInbox();
    } finally {
      setLoading(false);
    }
  };

  const setupMockInbox = () => {
    const mockChats = [
      { _id: 'mock_1', participant: { _id: recipientId || 'u_7', firstName: 'Kofi', lastName: 'Annan' }, contextItem: itemName || 'Campus Asset' }
    ];
    setConversations(mockChats);
    setActiveChat(mockChats[0]);
    setMessages([
      { _id: 'm_1', sender: 'u_7', text: `Hello! Is this context asset item still available for exchange?`, timestamp: new Date() }
    ]);
  };

  const fetchMessages = async (chatId) => {
    if (chatId === 'new_channel_context') return;
    try {
      const { data } = await api.get(`/messages/channel/${chatId}`);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed loading chat payload arrays:", err);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const payload = {
      text: newMessage,
      recipientId: activeChat.participant._id,
      contextItem: activeChat.contextItem
    };

    try {
      if (activeChat._id === 'new_channel_context') {
        // First message forces deployment initialization to persistent storage
        const { data } = await api.post('/messages/initialize', payload);
        setNewMessage('');
        fetchInbox(); // Re-fetch list to drop placeholders
      } else {
        const { data } = await api.post(`/messages/channel/${activeChat._id}/send`, { text: newMessage });
        setMessages(prev => [...prev, data]);
        setNewMessage('');
      }
    } catch (err) {
      // Offline local rollback rendering to keep workspace interactive
      const fallbackMsg = { _id: Date.now().toString(), sender: 'me', text: newMessage, timestamp: new Date() };
      setMessages(prev => [...prev, fallbackMsg]);
      setNewMessage('');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex overflow-hidden shadow-2xs">
        
        {/* Left Hand: Active Threads Control Pane */}
        <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h2 className="font-black text-base flex items-center gap-2">
              <MessageSquare className="text-emerald-600 dark:text-emerald-500" size={18} />
              Active Threads
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {conversations.map((chat) => {
              const isSelected = activeChat?._id === chat._id || (activeChat?._id === 'new_channel_context' && chat.participant?._id === recipientId);
              return (
                <button
                  key={chat._id}
                  onClick={() => { setActiveChat(chat); fetchMessages(chat._id); }}
                  className={`w-full p-4 text-left flex items-start space-x-3 transition ${
                    isSelected ? 'bg-white dark:bg-slate-800 shadow-2xs' : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300"><User size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                      {chat.participant?.firstName} {chat.participant?.lastName}
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                      {chat.contextItem || 'General Exchange Context'}
                    </p>
                  </div>
                </button>
              );
            })}
            {!loading && conversations.length === 0 && !recipientId && (
              <p className="text-center py-8 text-xs font-semibold text-slate-400">No active network logs found.</p>
            )}
          </div>
        </div>

        {/* Right Hand: Central Messenger Display Engine */}
        <div className="hidden md:flex flex-1 flex-col bg-white dark:bg-slate-900 justify-between">
          {activeChat ? (
            <>
              {/* Target Metadata Banner */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-50">
                    {activeChat.participant?.firstName} {activeChat.participant?.lastName}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    Regarding: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{activeChat.contextItem}</span>
                  </span>
                </div>
              </div>

              {/* Messaging Bubble Scroll Field */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/10">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === 'me' || msg.sender !== activeChat.participant?._id;
                  return (
                    <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-bl-none text-slate-800 dark:text-slate-100'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Toolbar Actions Input Row */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type an authenticated P2P message transmission..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-xs font-bold text-slate-900 dark:text-slate-50 placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
                />
                <button type="submit" className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center">
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500">
              <Inbox size={32} className="mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">Select an active trader string to begin context negotiation.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
