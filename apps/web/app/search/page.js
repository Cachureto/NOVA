'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';

const SUGGESTIONS = ['Audífonos para correr bajo $80.000', 'Sneakers para el día a día', 'Algo de tecnología urbana'];

export default function SearchPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(undefined);
  const [loading, setLoading] = useState(false);

  async function send(text) {
    const message = text ?? input;
    if (!message.trim()) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/search', { method: 'POST', body: { message, conversationId } });
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, products: res.products }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Buscador conversacional</h1>
      <p className="mt-2 text-muted">
        Escríbele a NOVA en lenguaje natural. Solo recomienda productos reales de nuestro catálogo — nunca inventa
        precios ni stock.
      </p>

      {messages.length === 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="badge hover:bg-surface-hover" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'ml-auto w-fit max-w-[80%]' : 'max-w-full'}>
            {m.role === 'user' ? (
              <div className="card ml-auto w-fit bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground">
                {m.text}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className={`card w-fit whitespace-pre-line px-4 py-2.5 text-sm ${m.error ? 'text-danger' : ''}`}>
                  {m.text}
                </div>
                {m.products?.length > 0 && <ProductGrid products={m.products} />}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="card w-fit px-4 py-2.5 text-sm text-muted">NOVA está pensando…</div>}
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-6 mt-8 flex gap-2">
        <input
          className="input"
          placeholder="Ej: audífonos para correr bajo $80.000"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}
