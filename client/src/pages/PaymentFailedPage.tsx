import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { XCircle, RefreshCw, MessageCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { WHATSAPP_NUMBER } from '../utils/constants';

interface MethodInfo {
  title: string;
  desc: string;
  tips: string[];
}

const methodInfo: Record<string, MethodInfo> = {
  stripe: {
    title: 'Paiement par carte échoué',
    desc: "Le paiement par carte bancaire n'a pas pu être traité.",
    tips: [
      "Vérifiez le numéro de carte, la date d'expiration et le code CVV",
      'Assurez-vous que votre carte dispose de fonds suffisants',
      'Certaines cartes requièrent une validation 3D Secure sur votre application bancaire',
      'Essayez un autre moyen de paiement (Orange Money, Wave)',
    ],
  },
  orange_money: {
    title: 'Paiement Orange Money échoué',
    desc: "Le paiement via Orange Money n'a pas abouti.",
    tips: [
      'Vérifiez votre solde Orange Money (composez *144#)',
      'Assurez-vous que votre numéro Orange est bien enregistré',
      'Vérifiez que vous avez bien validé le paiement sur votre téléphone',
      'Contactez le support Orange Money au 777',
    ],
  },
  wave: {
    title: 'Paiement Wave échoué',
    desc: "Le paiement via Wave n'a pas abouti.",
    tips: [
      "Vérifiez votre solde Wave dans l'application",
      "Assurez-vous que votre application Wave est à jour",
      "Essayez de fermer et relancer l'application Wave",
      "Contactez le support Wave depuis l'application",
    ],
  },
};

const defaultInfo: MethodInfo = {
  title: 'Paiement échoué',
  desc: "Le paiement n'a pas pu être traité.",
  tips: [
    'Vérifiez que votre moyen de paiement est valide et approvisionné',
    'Assurez-vous que vos informations de paiement sont correctes',
    'Essayez un autre moyen de paiement',
    'Contactez notre support WhatsApp pour une assistance immédiate',
  ],
};

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || '';
  const info = methodInfo[method] || defaultInfo;

  const whatsappMsg = "Bonjour Sunu Shop, j'ai un problème avec mon paiement et j'ai besoin d'aide.";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <>
      <Helmet><title>Paiement échoué — Sunu Shop</title></Helmet>
      <div className="container-custom py-12">
        <div className="mx-auto" style={{ maxWidth: 512 }}>

          {/* Error icon */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #E31B23, #B81219)' }}
            >
              <XCircle size={48} className="text-white" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="font-bold text-2xl mb-2">{info.title}</h1>
              <p className="text-gray-600">{info.desc}</p>
            </motion.div>
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
          >
            <h3 className="font-bold mb-4">Que faire maintenant ?</h3>
            <ul className="list-none p-0 flex flex-col gap-3">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span
                    className="rounded-full flex items-center justify-center text-red-500 font-bold shrink-0 mt-0.5 text-sm"
                    style={{ width: 20, height: 20, background: 'rgba(227,27,35,0.12)', minWidth: 20 }}
                  >
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* WhatsApp CTA — prominent for West African market */}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl font-semibold mb-4 text-sm text-white shadow"
            style={{ background: '#009A44' }}
          >
            <MessageCircle size={20} />
            Obtenir de l'aide via WhatsApp
          </motion.a>

          {/* Retry / Back buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <Link
              to="/commande"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Réessayer le paiement
            </Link>
            <Link
              to="/panier"
              className="btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} /> Retour au panier
            </Link>
          </motion.div>

          <div className="text-center flex flex-col gap-2">
            <Link to="/contact" className="text-sm text-gray-500 no-underline">
              Autres options de contact
            </Link>
            <Link to="/boutique" className="text-sm text-gray-500 no-underline flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
