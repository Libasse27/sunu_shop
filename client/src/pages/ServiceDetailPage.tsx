import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Phone, CheckCircle, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import { SITE_NAME, WHATSAPP_NUMBER } from '../utils/constants';
import { formatPrice } from '../utils/formatPrice';

interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  startingPrice: number;
  estimatedDuration: string;
  image: string;
  isAvailable: boolean;
  features: string[];
  whatsappMessage: string;
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/services/slug/${slug}`)
      .then(r => setService(r.data.data))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (!service) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="font-bold text-2xl mb-6">Service non trouvé</h2>
        <Link to="/services" className="btn-primary">Retour aux services</Link>
      </div>
    );
  }

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(service.whatsappMessage || `Bonjour Sunu Shop, je suis intéressé par ${service.title}`)}`;

  return (
    <>
      <Helmet>
        <title>{service.title} — {SITE_NAME}</title>
        <meta name="description" content={service.shortDescription} />
      </Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10">
          <nav className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link to="/" className="no-underline hover:text-white transition-colors" style={{ color: 'inherit' }}>Accueil</Link>
            <ChevronRight size={14} />
            <Link to="/services" className="no-underline hover:text-white transition-colors" style={{ color: 'inherit' }}>Services</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{service.title}</span>
          </nav>
          <h1 className="font-bold text-2xl text-white mb-0">{service.title}</h1>
          <p className="text-sm mt-1 mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{service.category}</p>
        </div>
      </section>

      <div className="container-custom py-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {service.image && (
              <div className="rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-start gap-5 mb-6">
              <div className="flex-1">
                <h2 className="font-bold text-2xl text-gray-900">{service.title}</h2>
              </div>
              {service.isAvailable ? (
                <span className="rounded-full px-3 py-2 text-sm font-medium shrink-0" style={{ background: 'rgba(0,154,68,0.12)', color: '#007A35' }}>Disponible</span>
              ) : (
                <span className="rounded-full bg-gray-100 text-gray-500 px-3 py-2 text-sm font-medium shrink-0">Indisponible</span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed text-base mb-6">{service.description}</p>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="mb-6">
                <h2 className="font-bold text-lg mb-4">Ce qui est inclus</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: 'rgba(0,154,68,0.08)' }}>
                      <CheckCircle size={18} className="shrink-0" style={{ color: '#009A44' }} />
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/services" className="inline-flex items-center gap-2 text-primary text-sm no-underline">
              <ArrowLeft size={16} />
              Voir tous les services
            </Link>
          </div>

          {/* Sidebar — Booking */}
          <div className="lg:col-span-1">
            <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-8 sticky top-24 overflow-hidden">
              {/* Pan-African strip */}
              <div className="absolute top-0 left-0 right-0 flex" style={{ height: '3px' }}>
                <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
              </div>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Tarif indicatif</p>
                <p className="font-bold text-3xl text-primary mb-0">{formatPrice(service.startingPrice)}</p>
                <p className="text-sm text-gray-500 mt-1">Prix définitif après diagnostic</p>
              </div>

              {service.estimatedDuration && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 mb-6">
                  <Clock size={18} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-0">Durée estimée</p>
                    <p className="text-sm font-medium mb-0">{service.estimatedDuration}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white transition-colors"
                  style={{ background: '#009A44' }}
                >
                  <MessageCircle size={20} />
                  Demander un devis WhatsApp
                </a>
                <a
                  href={`tel:${WHATSAPP_NUMBER}`}
                  className="w-full border flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors hover:opacity-80"
                  style={{ color: '#009A44', borderColor: '#009A44' }}
                >
                  <Phone size={20} />
                  Appeler {WHATSAPP_NUMBER}
                </a>
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500 text-center mb-3">Nous intervenons à :</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Dakar', 'Thiès', 'Saint-Louis', 'Bamako', 'Conakry'].map(city => (
                    <span key={city} className="bg-gray-100 text-gray-600 rounded-full text-sm px-2 py-1">{city}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
