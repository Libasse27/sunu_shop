import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/common/Breadcrumb';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Politique de Confidentialité — Sunu Shop</title>
        <meta name="description" content="Politique de confidentialité et protection des données personnelles de Sunu Shop" />
      </Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10">
          <div className="flex justify-start mb-2">
            <Breadcrumb items={[{ label: 'Politique de confidentialité' }]} />
          </div>
          <h1 className="font-bold text-2xl text-white mb-1">Politique de Confidentialité</h1>
          <p className="text-sm mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>Dernière mise à jour : 15 février 2026</p>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container-custom py-10"
      >
        <div className="mx-auto" style={{ maxWidth: 900 }}>

          <div className="flex flex-col gap-6">
            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                1. Collecte des Données
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Sunu Shop collecte les données personnelles que vous nous fournissez volontairement lors de votre inscription, de vos commandes ou de votre navigation sur notre site. Les données collectées incluent :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Nom et prénom</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone</li>
                <li>Adresse de livraison et de facturation</li>
                <li>Informations de paiement (traitées de manière sécurisée par nos prestataires)</li>
                <li>Historique des commandes et préférences d'achat</li>
                <li>Données de navigation (adresse IP, type de navigateur, pages consultées)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                2. Utilisation des Données
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Nous utilisons vos données personnelles dans les buts suivants :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Traiter et expédier vos commandes</li>
                <li>Vous envoyer des confirmations de commande et des mises à jour de livraison</li>
                <li>Gérer votre compte client et votre historique d'achat</li>
                <li>Améliorer nos produits et services</li>
                <li>Vous envoyer des offres promotionnelles (avec votre consentement)</li>
                <li>Prévenir la fraude et assurer la sécurité de notre plateforme</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                3. Cookies et Technologies Similaires
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Notre site utilise des cookies pour améliorer votre expérience de navigation. Les cookies nous permettent de :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Mémoriser vos préférences et votre panier d'achat</li>
                <li>Analyser le trafic et l'utilisation du site</li>
                <li>Personnaliser le contenu et les publicités</li>
                <li>Faciliter le partage sur les réseaux sociaux</li>
              </ul>
              <p className="text-gray-500 leading-relaxed mt-4 mb-0">
                Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut limiter certaines fonctionnalités du site.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                4. Partage des Données
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Nous ne vendons jamais vos données personnelles à des tiers. Nous pouvons partager vos informations avec :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>
                  <strong>Prestataires de services :</strong> Orange Money, Wave, Free Money, Stripe, PayPal pour le traitement des paiements
                </li>
                <li>
                  <strong>Transporteurs :</strong> Pour assurer la livraison de vos commandes
                </li>
                <li>
                  <strong>Partenaires marketing :</strong> Uniquement avec votre consentement explicite
                </li>
                <li>
                  <strong>Autorités légales :</strong> Si requis par la loi sénégalaise ou dans le cadre d'une procédure judiciaire
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                5. Sécurité des Données
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Ces mesures incluent :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Chiffrement SSL/TLS pour toutes les transactions</li>
                <li>Stockage sécurisé des mots de passe avec hachage bcrypt</li>
                <li>Accès limité aux données personnelles aux seuls employés autorisés</li>
                <li>Audits de sécurité réguliers</li>
                <li>Sauvegarde régulière des données</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                6. Droits des Utilisateurs
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Conformément à la législation en vigueur au Sénégal et aux normes internationales de protection des données, vous disposez des droits suivants :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>
                  <strong>Droit d'accès :</strong> Vous pouvez demander l'accès à vos données personnelles
                </li>
                <li>
                  <strong>Droit de rectification :</strong> Vous pouvez corriger vos données inexactes ou incomplètes
                </li>
                <li>
                  <strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données (sous réserve de nos obligations légales)
                </li>
                <li>
                  <strong>Droit d'opposition :</strong> Vous pouvez vous opposer au traitement de vos données à des fins marketing
                </li>
                <li>
                  <strong>Droit à la portabilité :</strong> Vous pouvez demander une copie de vos données dans un format structuré
                </li>
                <li>
                  <strong>Droit de limitation :</strong> Vous pouvez demander la limitation du traitement de vos données
                </li>
              </ul>
              <p className="text-gray-500 leading-relaxed mt-4 mb-0">
                Pour exercer ces droits, veuillez nous contacter à l'adresse : <a href="mailto:confidentialite@sunushop.sn" style={{ color: '#009A44' }}>confidentialite@sunushop.sn</a>
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                7. Conservation des Données
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les données de commande sont conservées pendant 10 ans conformément aux obligations comptables et fiscales sénégalaises. Les données de compte inactif depuis plus de 3 ans peuvent être supprimées après notification.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                8. Transferts Internationaux
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Vos données peuvent être transférées et traitées dans des pays en dehors du Sénégal, notamment pour le traitement des paiements et l'hébergement de nos serveurs. Dans tous les cas, nous nous assurons que ces transferts respectent les normes de protection des données appropriées.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                9. Modifications de la Politique
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entreront en vigueur dès leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page. En cas de modification substantielle, nous vous en informerons par e-mail.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                10. Contact
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, vous pouvez nous contacter :
              </p>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <p className="font-medium mb-2">Sunu Shop SARL</p>
                <p className="text-gray-500 text-sm mb-1">Adresse : Dakar, Sénégal</p>
                <p className="text-gray-500 text-sm mb-1">E-mail : <a href="mailto:confidentialite@sunushop.sn" style={{ color: '#009A44' }}>confidentialite@sunushop.sn</a></p>
                <p className="text-gray-500 text-sm mb-0">Téléphone : +221 33 XXX XX XX</p>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}
