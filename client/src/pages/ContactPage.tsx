import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { WHATSAPP_NUMBER } from '../utils/constants';

const contactCards = [
  {
    icon: Phone,
    title: 'Téléphone',
    text: WHATSAPP_NUMBER,
    sub: 'Lun–Sam : 8h–20h',
    accent: '#009A44',
  },
  {
    icon: Mail,
    title: 'Email',
    text: 'contact@sunushop.sn',
    sub: 'Réponse sous 24h',
    accent: '#FCD116',
  },
  {
    icon: MapPin,
    title: 'Atelier',
    text: 'Plateau, Centre-ville',
    sub: 'Dakar, Sénégal',
    accent: '#E31B23',
  },
  {
    icon: Clock,
    title: 'Horaires',
    text: 'Lun–Sam : 8h–20h',
    sub: 'Dimanche sur RDV',
    accent: '#009A44',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Message envoyé ! Nous vous répondrons sous 24h.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 800);
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour TechAfrique, je voudrais avoir des informations.`;

  return (
    <>
      <Helmet><title>Contact — TechAfrique</title></Helmet>

      {/* ── Hero ── */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundColor: '#003D1C' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -64, right: -64, width: 256, height: 256, backgroundColor: 'rgba(0,154,68,0.10)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -48, left: -48, width: 192, height: 192, backgroundColor: 'rgba(206,17,38,0.10)' }} />
        <div className="absolute top-0 bottom-0 left-0 flex flex-col" style={{ width: 6 }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10 text-center">
          <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm font-bold uppercase mb-4"
            style={{ backgroundColor: 'rgba(252,209,22,0.15)', borderColor: 'rgba(252,209,22,0.30)', color: '#FCD116', letterSpacing: '0.1em' }}>
            <MessageCircle size={11} /> On est à l'écoute
          </span>
          <h1 className="font-bold text-white mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Contactez-nous</h1>
          <p className="mx-auto mb-0" style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1.1rem', maxWidth: 520 }}>
            Notre équipe technique est à votre disposition pour répondre à toutes vos questions
          </p>
        </div>
      </section>

      {/* Pan-African strip */}
      <div className="flex" style={{ height: 6 }}>
        <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
      </div>

      {/* ── WhatsApp CTA ── */}
      <section className="py-6 bg-gray-50 border-b">
        <div className="container-custom">
          <div className="mx-auto rounded-xl overflow-hidden shadow" style={{ maxWidth: 640 }}>
            <div className="flex" style={{ height: 4 }}>
              <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
              <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
              <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
            </div>
            <div className="p-6 md:p-8 text-white text-center" style={{ background: 'linear-gradient(to right, #009A44, #007A35)' }}>
              <div className="rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.20)' }}>
                <MessageCircle size={28} />
              </div>
              <h2 className="text-lg font-bold mb-1">Service rapide via WhatsApp</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Pour les demandes urgentes, devis de réparation ou questions techniques — réponse sous 1h.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2 font-bold text-sm shadow-sm"
                style={{ backgroundColor: '#fff', color: '#009A44' }}
              >
                <MessageCircle size={18} /> Ouvrir WhatsApp
              </a>
              <p className="mt-4 text-sm mb-0" style={{ color: 'rgba(255,255,255,0.50)' }}>{WHATSAPP_NUMBER} — Lun–Sam : 8h–20h</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="py-6 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mx-auto" style={{ maxWidth: 900 }}>
            {contactCards.map(card => (
              <div key={card.title} className="relative bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center overflow-hidden">
                <div className="absolute top-0 left-0 right-0" style={{ height: 2, backgroundColor: card.accent }} />
                <div className="rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ width: 44, height: 44, backgroundColor: `${card.accent}15` }}>
                  <card.icon size={20} style={{ color: card.accent }} />
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-0">{card.text}</p>
                <p className="text-sm text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form ── */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="mx-auto" style={{ maxWidth: 640 }}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex" style={{ height: 4 }}>
                <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
              </div>
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Envoyer un message</h2>
                <p className="text-gray-500 text-sm mb-6">Remplissez le formulaire et nous vous répondrons rapidement.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: '#374151' }}>Nom complet *</label>
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="input-field" placeholder="Aminata Diallo" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: '#374151' }}>Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        className="input-field" placeholder="votre@email.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#374151' }}>Sujet *</label>
                    <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="input-field" placeholder="Ex: Demande de devis réparation" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#374151' }}>Message *</label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      className="input-field" style={{ resize: 'none' }} rows={5} placeholder="Décrivez votre demande..." required />
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={sending} className="btn-primary">
                      {sending
                        ? <span className="flex items-center gap-2">
                            <span className="rounded-full border-2 border-white animate-spin"
                              style={{ width: 16, height: 16, borderStyle: 'solid', borderTopColor: 'transparent', display: 'inline-block' }} />
                            Envoi...
                          </span>
                        : <span className="flex items-center gap-2"><Send size={16} /> Envoyer le message</span>
                      }
                    </button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <CheckCircle size={12} style={{ color: '#009A44' }} />
                      Réponse garantie sous 24h
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
