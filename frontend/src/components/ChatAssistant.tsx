import { FormEvent, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import type { ChatMessage } from '../types';
import { getChatbotAnswer } from '../lib/api';

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hola, soy tu asistente. Puedo recomendarte productos por presupuesto, ocasion o gusto.',
    },
  ]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await getChatbotAnswer(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'No pude responder en este momento.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="chat-trigger" onClick={() => setOpen((prev) => !prev)}>
        {open ? <X size={18} /> : <MessageCircle size={18} />} Asistente IA
      </button>

      {open && (
        <section className="chat-panel" aria-label="Asistente virtual">
          <header>
            <p>
              <Bot size={15} /> Lili IA
            </p>
          </header>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={message.role === 'user' ? 'msg user' : 'msg bot'}>
                {message.content}
              </article>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chat-form">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ej. Quiero algo economico para regalo"
            />
            <button type="submit" disabled={loading} aria-label="Enviar mensaje">
              <Send size={15} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
