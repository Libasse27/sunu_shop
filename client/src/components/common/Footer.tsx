import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SITE_NAME, WHATSAPP_NUMBER } from '../../utils/constants';
import api from '../../services/api';

export default function Footer() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour TechAfrique, j'ai une question.`;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/newsletter/subscribe', { email });
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <footer>
        {/* Pan-African top strip */}
        <div className="flex" style={{ height: '6px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>

        {/* Newsletter */}
        <div className="py-10" style={{ backgroundColor: '#009A44' }}>
          <div className="container-custom text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Restez informé des offres tech
            </h3>
            <p className="text-white mb-6" style={{ opacity: 0.8 }}>Inscrivez-vous pour recevoir nos promotions et nouveautés</p>
            {success ? (
              <div
                className="flex items-center justify-center gap-2 rounded-2xl px-6 py-4 mx-auto"
                style={{ maxWidth: '28rem', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <CheckCircle size={20} className="text-white shrink-0" />
                <span className="text-white font-medium">Merci ! Vous êtes inscrit(e) à notre newsletter.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mx-auto" style={{ maxWidth: '28rem' }}>
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="Votre adresse email"
                    className="px-4 py-3 rounded-full text-gray-900 border-0 w-full"
                    style={{ outline: 'none' }}
                    required
                  />
                  {error && <p className="text-white text-sm text-left pl-4 mb-0" style={{ opacity: 0.8 }}>{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-white px-6 py-3 rounded-full font-medium border-0 transition-colors flex items-center justify-center gap-2 shrink-0"
                  style={{ backgroundColor: loading ? '#B81019' : '#E31B23', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  S'inscrire
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main footer */}
        <div className="text-white" style={{ backgroundColor: '#003D1C' }}>
          <div className="container-custom py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <img src="/logo.svg" alt="TechAfrique" className="rounded-lg" style={{ height: '2.75rem', width: 'auto', maxWidth: '11rem' }} />
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Votre partenaire tech en Afrique de l'Ouest. Informatique, téléphonie, électronique et services de réparation.
                </p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                    style={{ width: '2.25rem', height: '2.25rem', backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Facebook size={16} />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                    style={{ width: '2.25rem', height: '2.25rem', backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Instagram size={16} />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                    style={{ width: '2.25rem', height: '2.25rem', backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Twitter size={16} />
                  </a>
                </div>
              </div>

              {/* Boutique links */}
              <div>
                <h5 className="font-bold text-sm uppercase mb-6" style={{ letterSpacing: '0.08em', color: '#FCD116' }}>Boutique</h5>
                <ul className="list-none p-0 flex flex-col gap-2 text-sm text-gray-500">
                  <li><Link to="/boutique/informatique" className="no-underline text-gray-500 hover:text-white transition-colors">Informatique</Link></li>
                  <li><Link to="/boutique/telephones" className="no-underline text-gray-500 hover:text-white transition-colors">Téléphonie Mobile</Link></li>
                  <li><Link to="/boutique/electronique" className="no-underline text-gray-500 hover:text-white transition-colors">Électronique & TV</Link></li>
                  <li><Link to="/boutique/electromenager" className="no-underline text-gray-500 hover:text-white transition-colors">Électroménager</Link></li>
                  <li><Link to="/boutique/gaming" className="no-underline text-gray-500 hover:text-white transition-colors">Gaming</Link></li>
                  <li><Link to="/services" className="no-underline font-medium transition-colors" style={{ color: '#FCD116' }}>Services Réparation</Link></li>
                </ul>
              </div>

              {/* Info */}
              <div>
                <h5 className="font-bold text-sm uppercase mb-6" style={{ letterSpacing: '0.08em', color: '#FCD116' }}>Informations</h5>
                <ul className="list-none p-0 flex flex-col gap-2 text-sm text-gray-500">
                  <li><Link to="/a-propos" className="no-underline text-gray-500 hover:text-white transition-colors">À propos</Link></li>
                  <li><Link to="/contact" className="no-underline text-gray-500 hover:text-white transition-colors">Contact</Link></li>
                  <li><Link to="/faq" className="no-underline text-gray-500 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link to="/suivi-commande" className="no-underline text-gray-500 hover:text-white transition-colors">Suivi de commande</Link></li>
                  <li><Link to="/politique-de-confidentialite" className="no-underline text-gray-500 hover:text-white transition-colors">Politique de confidentialité</Link></li>
                  <li><Link to="/conditions-generales" className="no-underline text-gray-500 hover:text-white transition-colors">Conditions générales</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h5 className="font-bold text-sm uppercase mb-6" style={{ letterSpacing: '0.08em', color: '#FCD116' }}>Contact & Services</h5>
                <ul className="list-none p-0 flex flex-col gap-4 text-sm text-gray-500">
                  <li className="flex items-start gap-3">
                    <MapPin size={16} className="mt-1 shrink-0" style={{ color: '#009A44' }} />
                    <span>Dakar, Sénégal<br />Plateau, Centre-ville</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone size={16} className="shrink-0" style={{ color: '#009A44' }} />
                    <span>+221 77 382 85 22</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail size={16} className="shrink-0" style={{ color: '#009A44' }} />
                    <span>contact@sunushop.sn</span>
                  </li>
                  <li>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors hover:bg-[#007A35]"
                      style={{ backgroundColor: '#009A44', marginTop: '0.25rem' }}
                    >
                      <MessageCircle size={16} />
                      WhatsApp Services
                    </a>
                  </li>
                </ul>
                <div className="mt-6">
                  <p className="text-sm mb-2" style={{ color: '#6b7280' }}>Moyens de paiement</p>
                  <div className="flex gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>🟠 Orange Money</span>
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>🌊 Wave</span>
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>💳 Visa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t py-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
              <span>&copy; {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.</span>
              <div className="flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <span className="rounded-full" style={{ width: '0.5rem', height: '0.5rem', display: 'inline-block', backgroundColor: '#009A44' }} />
                <span className="rounded-full" style={{ width: '0.5rem', height: '0.5rem', display: 'inline-block', backgroundColor: '#FCD116' }} />
                <span className="rounded-full" style={{ width: '0.5rem', height: '0.5rem', display: 'inline-block', backgroundColor: '#E31B23' }} />
                <span className="ml-1 text-gray-600">Made with ❤️ in West Africa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed flex items-center justify-center rounded-full shadow-lg text-white transition-all z-50 animate-pulse-wa hover:scale-110"
        style={{
          bottom: '1.5rem',
          right: '1.5rem',
          width: '3.5rem',
          height: '3.5rem',
          backgroundColor: '#009A44',
          textDecoration: 'none',
        }}
        title="Contactez-nous sur WhatsApp"
        aria-label="Contactez-nous sur WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
}
