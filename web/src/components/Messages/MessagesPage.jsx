import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch existing conversation list logs from database
    const fetchConversations = async () => {
      try {
        // Replace with your actual messages/conversations endpoint if different
        const { data } = await api.get('/messages/conversations');
        setConversations(data || []);
      } catch (err) {
        console.error("Could not synchronize historical conversation list", err);
      }
    };
    fetchConversations();

    // TODO: Initialize Socket.io connection here
    // const socket = io(process.env.VITE_API_URL);
    // socket.on('chat message', (msg) => setMessages((prev) => [...prev, msg]));
  }, []);

  // 2. Intercept and parse incoming URL queries from the Marketplace details view
  useEffect(() => {
    const recipientId = searchParams.get('recipientId');
    const itemName = searchParams.get('itemName');

    if (recipientId) {
      // Establish user workspace instance data structure block
      const targetUserContext = {
        _id: recipientId,
        name: 'Campus Member', // Temporary fallback banner until dynamic profile load completes
      };

      setSelectedUser(targetUserContext);

      // Auto-populate icebreaker text linking the conversation directly to the specific asset item
      if (itemName) {
        setMessageText(`Hi, I'm interested in your listed item: "${decodeURIComponent(itemName)}". Is it still available?`);
      }
    }
  }, [searchParams]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      // TODO: Implement HTTP routing backup save & Socket.io emit payload events
      console.log(`Sending message to ${selectedUser?._id}: ${messageText}`);
      
      // Local UI update simulation stub logic
      setMessages((prev) => [...prev, { text: messageText, sender: 'me', timestamp: new Date() }]);
      setMessageText('');
    } catch (err) {
      console.error("Failed to push transmission onto array matrix stream", err);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        
        {/* Conversations List Sidebar */}
        <div className="border-r border-slate-200 pr-4">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Threads</p>
          {conversations.length > 0 ? (
            conversations.map((chat) => (
              <button 
                key={chat._id} 
                onClick={() => setSelectedUser(chat.participant)}
                className={`w-full text-left p-3 rounded-xl transition ${selectedUser?._id === chat.participant?._id ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              >
                {chat.participant?.firstName || 'Student Trader'}
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">Conversations will appear here.</p>
          )}
        </div>

        {/* Messaging Central Stage view */}
        <div className="col-span-2">
          {selectedUser ? (
            <div className="flex flex-col gap-4 h-full min-h-[300px] justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                  Chatting with: <span className="text-emerald-600">{selectedUser.name || 'Campus Provider'}</span>
                </p>
                
                {/* Message Log Thread Loop */}
                <div className="mt-4 flex flex-col gap-2 max-h-[250px] overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl max-w-[75%] text-sm ${msg.sender === 'me' ? 'bg-emerald-600 text-white self-end rounded-tr-none' : 'bg-slate-100 text-slate-800 self-start rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Input Action Matrix Tray */}
              <div className="flex gap-2 mt-auto">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
                <button onClick={handleSendMessage} className="rounded-3xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition shadow-xs">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[300px]">
              <p className="text-center text-slate-400 text-sm font-medium">Select a conversation or click Message on a campus listing to start</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
