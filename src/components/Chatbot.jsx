import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';

const Chatbot = ({ dashboardData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {}
    } else {
      setMessages([
        { role: 'assistant', content: 'Hello! I am your Nexus Dashboard Assistant. I can only answer questions based on the current ISS location, speed, astronauts, and latest news. How can I help?' }
      ]);
    }
  }, []);

  // Save history (last 30)
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages.slice(-30)));
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    const initial = [{ role: 'assistant', content: 'Chat cleared. How can I help you with the dashboard data?' }];
    setMessages(initial);
    localStorage.setItem('chat_history', JSON.stringify(initial));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 1. Try Vercel Serverless Function
      let res = null;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.slice(-10), // Send last 10 messages for context
            dashboardData
          })
        });
      } catch (e) {
        // network error
      }

      let replyText = '';
      const contentType = res?.headers?.get("content-type");

      if (res && res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        replyText = data.response;
      } else {
        // 2. Fallback to direct Hugging Face call if /api/chat is not available (local dev without vercel cli)
        const token = import.meta.env.VITE_AI_TOKEN;
        if (!token) throw new Error("API Token missing");

        const systemInstruction = `You are an AI for a dashboard. The dashboard data is: ${JSON.stringify(dashboardData)}. 
RULE: ONLY answer using this data. Refuse to answer outside questions. Be concise.`;
        
        let promptMessages = [
          { role: 'system', content: systemInstruction },
          ...newMessages.slice(-5).map(m => ({
             role: m.role,
             content: m.content
          }))
        ];

        const hfRes = await fetch('/hf-api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: promptMessages,
            max_tokens: 200,
            temperature: 0.1
          })
        });

        if (!hfRes.ok) {
           if (hfRes.status === 503) {
             replyText = "The AI model is currently loading on Hugging Face. Please wait a minute and try again.";
           } else {
             throw new Error("Direct HF API call failed.");
           }
        } else {
          const hfData = await hfRes.json();
          replyText = hfData.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response.";
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the AI. Please check your API keys." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-full max-w-sm sm:w-[380px] h-[500px] bg-card border shadow-2xl rounded-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-muted/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Dashboard AI</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full" title="Clear Chat">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-muted rounded-2xl rounded-tl-none flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-4 border-t bg-background rounded-b-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ISS or News..."
              className="w-full pl-4 pr-12 py-3 bg-muted border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
