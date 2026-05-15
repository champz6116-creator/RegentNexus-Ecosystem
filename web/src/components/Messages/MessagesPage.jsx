import { useEffect, useState } from 'react';
import api from '../../api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Initialize Socket.io connection here
    // const socket = io(process.env.VITE_API_URL);
    // socket.on('chat message', (msg) => setMessages((prev) => [...prev, msg]));
  }, []);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setMessageText('');
    // TODO: Implement Socket.io emit
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Conversations List */}
        <div className="border-r border-slate-200">
          <p className="text-sm text-slate-500">Conversations will appear here.</p>
        </div>

        {/* Messages View */}
        <div className="col-span-2">
          {selectedUser ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">Chat with {selectedUser.name}</p>
              <div className="flex gap-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
                <button onClick={handleSendMessage} className="rounded-3xl bg-slate-900 px-5 py-3 text-white">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500">Select a conversation to start messaging</p>
          )}
        </div>
      </div>
    </section>
  );
}
