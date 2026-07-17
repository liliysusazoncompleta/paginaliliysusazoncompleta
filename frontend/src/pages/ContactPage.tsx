import { FormEvent, useState } from 'react';
import { Clock, Instagram, MessageCircle, Send } from 'lucide-react';
import { sendContactMessage } from '../lib/api';

const phone = import.meta.env.VITE_WHATSAPP_PHONE ?? '573177719249';
const displayPhone = '+57 317 771 9249';

type ContactForm = {
  nombre: string;
  telefono: string;
  correo: string;
  mensaje: string;
};

const emptyForm: ContactForm = { nombre: '', telefono: '', correo: '', mensaje: '' };

export function ContactPage() {
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.nombre || !form.telefono || !form.mensaje) return;

    setSending(true);
    setError(null);
    setSent(false);

    try {
      await sendContactMessage(form);
      setSent(true);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="contact-hero">
        <div className="contact-hero-copy">
          <span className="pill-tag">
            <MessageCircle size={14} /> Estamos para ti
          </span>
          <h1>Queremos escucharte</h1>
          <p>
            Ya sea para un pedido especial, dudas sobre nuestras zonas de cobertura o simplemente para
            saludarnos. En nuestra cocina siempre hay espacio para uno mas.
          </p>
        </div>
        <div className="contact-hero-media">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=65"
            alt="Cocina de Lili"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <div className="contact-layout">
        <section className="panel-card contact-form-card">
          <h2>Envianos un mensaje</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nombre completo*
                <input
                  required
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  placeholder="Ej. Camila Rojas"
                />
              </label>
              <label>
                Telefono*
                <input
                  required
                  value={form.telefono}
                  onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                  placeholder="+57 300 000 0000"
                />
              </label>
              <label className="full-width">
                Correo electronico
                <input
                  type="email"
                  value={form.correo}
                  onChange={(event) => setForm((prev) => ({ ...prev, correo: event.target.value }))}
                  placeholder="tu@correo.com"
                />
              </label>
              <label className="full-width">
                Mensaje*
                <textarea
                  required
                  rows={4}
                  value={form.mensaje}
                  onChange={(event) => setForm((prev) => ({ ...prev, mensaje: event.target.value }))}
                  placeholder="¿En que te podemos ayudar hoy, mi cielo?"
                />
              </label>
            </div>

            {sent ? (
              <p className="success-text">Tu mensaje fue enviado. Te responderemos pronto.</p>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="summary-button contact-submit" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar mensaje'} <Send size={16} />
            </button>
          </form>
        </section>

        <aside className="contact-info-column">
          <article className="contact-info-card">
            <span className="contact-info-icon wa">
              <MessageCircle size={20} />
            </span>
            <div>
              <h3>Escribenos por WhatsApp</h3>
              <p>Respuestas rapidas para pedidos</p>
              <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="contact-info-value">
                {displayPhone}
              </a>
            </div>
          </article>

          <article className="contact-info-card">
            <span className="contact-info-icon ig">
              <Instagram size={20} />
            </span>
            <div>
              <h3>Siguenos en Instagram</h3>
              <p>Mira nuestros platos diarios</p>
              <a
                href="https://www.instagram.com/liliysusazoncompleta"
                target="_blank"
                rel="noreferrer"
                className="contact-info-value"
              >
                @liliysusazoncompleta
              </a>
            </div>
          </article>

          <article className="contact-info-card">
            <span className="contact-info-icon hours">
              <Clock size={20} />
            </span>
            <div>
              <h3>Horarios de Atencion</h3>
              <div className="hours-list">
                <p>
                  <span>Lunes - Viernes</span> <strong>09:00 AM - 6:00 PM</strong>
                </p>
                <p>
                  <span>Sabados</span> <strong>9:00 AM - 1:00 PM</strong>
                </p>
                <p>
                  <span>Domingos y Festivos</span> <strong className="closed">Cerrado</strong>
                </p>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}
