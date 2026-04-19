import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/common/Breadcrumb';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Conditions Générales de Vente — Sunu Shop</title>
        <meta name="description" content="Conditions générales de vente et d'utilisation de Sunu Shop" />
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
            <Breadcrumb items={[{ label: 'Conditions générales' }]} />
          </div>
          <h1 className="font-bold text-2xl text-white mb-1">Conditions Générales de Vente</h1>
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
                1. Objet
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre Sunu Shop SARL, société de droit sénégalais (ci-après "le Vendeur"), et toute personne physique ou morale souhaitant effectuer un achat via le site internet www.sunushop.sn (ci-après "le Client"). Toute commande passée sur le site implique l'acceptation sans réserve des présentes CGV par le Client.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                2. Inscription et Compte Client
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Pour effectuer une commande, le Client doit créer un compte en fournissant des informations exactes et à jour. Le Client est responsable de la confidentialité de ses identifiants de connexion.
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>L'âge minimum pour créer un compte est de 18 ans</li>
                <li>Chaque personne ne peut créer qu'un seul compte</li>
                <li>Le Client s'engage à ne pas usurper l'identité d'un tiers</li>
                <li>Sunu Shop se réserve le droit de suspendre ou supprimer un compte en cas de violation des CGV</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                3. Commandes
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>3.1 Processus de commande</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Le Client sélectionne les produits qu'il souhaite commander, les ajoute à son panier, puis valide sa commande après avoir vérifié le détail de celle-ci. La commande ne devient définitive qu'après confirmation du paiement.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>3.2 Confirmation de commande</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Un e-mail de confirmation est envoyé au Client dès validation de la commande et du paiement. Cet e-mail contient le numéro de commande et le détail des produits commandés.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>3.3 Annulation de commande</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Le Client peut annuler sa commande gratuitement dans un délai de 2 heures suivant la confirmation, sous réserve que celle-ci n'ait pas encore été expédiée. Passé ce délai, les conditions de retour s'appliquent (article 7).
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                4. Prix et Paiement
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>4.1 Prix</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Tous les prix sont indiqués en Francs CFA (FCFA / XOF), toutes taxes comprises. Sunu Shop se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix figurant au catalogue le jour de la commande sera le seul applicable au Client.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>4.2 Moyens de paiement</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Les moyens de paiement acceptés sont :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Orange Money</li>
                <li>Wave</li>
                <li>Free Money</li>
                <li>Carte bancaire (Visa, Mastercard) via Stripe</li>
                <li>PayPal</li>
                <li>Paiement à la livraison (cash) dans certaines zones de Dakar</li>
              </ul>
              <p className="text-gray-500 leading-relaxed mt-4 mb-4">
                <strong>4.3 Sécurité des paiements</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Toutes les transactions sont sécurisées. Sunu Shop ne stocke aucune information bancaire. Les paiements sont traités par des prestataires certifiés PCI-DSS.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                5. Livraison
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>5.1 Zones de livraison</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Nous livrons au Sénégal et dans plusieurs pays d'Afrique de l'Ouest (Côte d'Ivoire, Mali, Guinée, Burkina Faso, etc.).
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>5.2 Délais de livraison</strong>
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Dakar : 24 à 48 heures</li>
                <li>Autres villes du Sénégal : 3 à 5 jours ouvrés</li>
                <li>Afrique de l'Ouest : 5 à 10 jours ouvrés</li>
              </ul>
              <p className="text-gray-500 leading-relaxed mt-4 mb-4">
                Ces délais sont donnés à titre indicatif et ne constituent pas une obligation de résultat.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>5.3 Frais de livraison</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                La livraison est gratuite pour toute commande supérieure à 25 000 FCFA. En dessous de ce montant, des frais de livraison de 3 000 FCFA s'appliquent pour le Sénégal. Les frais pour les livraisons internationales varient selon la destination.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>5.4 Réception de la commande</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Le Client doit vérifier l'état du colis en présence du livreur. En cas de dommage apparent, le Client doit refuser le colis et en informer immédiatement Sunu Shop. Toute réclamation formulée après réception du colis ne pourra être prise en compte.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                6. Disponibilité des Produits
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Nos offres de produits sont valables tant qu'elles sont visibles sur le site, dans la limite des stocks disponibles. En cas d'indisponibilité d'un produit après passation de la commande, le Client en sera informé par e-mail dans les plus brefs délais. Le Client pourra alors choisir un produit de remplacement ou annuler sa commande avec remboursement intégral.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                7. Retours et Remboursements
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>7.1 Droit de rétractation</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Le Client dispose d'un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités. Les produits doivent être retournés dans leur emballage d'origine, non utilisés et non portés.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>7.2 Produits exclus du droit de rétractation</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Pour des raisons d'hygiène, les produits suivants ne peuvent être retournés une fois leur emballage descellé :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Perruques et tissages sortis de leur emballage</li>
                <li>Produits cosmétiques et de soin ouverts</li>
                <li>Bijoux piercing</li>
              </ul>
              <p className="text-gray-500 leading-relaxed mt-4 mb-4">
                <strong>7.3 Procédure de retour</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Pour retourner un produit, le Client doit :
              </p>
              <ol className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>Contacter le service client à retours@sunushop.sn</li>
                <li>Recevoir un numéro d'autorisation de retour (RMA)</li>
                <li>Renvoyer le produit avec le numéro RMA dans un délai de 7 jours</li>
              </ol>
              <p className="text-gray-500 leading-relaxed mt-4 mb-4">
                Les frais de retour sont à la charge du Client, sauf en cas de produit défectueux ou d'erreur de livraison.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                <strong>7.4 Remboursement</strong>
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Le remboursement sera effectué dans un délai de 14 jours à compter de la réception du produit retourné, par le même moyen de paiement que celui utilisé pour la commande.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                8. Garantie et Service Après-Vente
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Tous nos produits bénéficient de la garantie légale de conformité. En cas de défaut de conformité constaté dans les 24 mois suivant la livraison, le Client peut demander la réparation, le remplacement ou le remboursement du produit.
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Pour les cheveux naturels, nous garantissons l'authenticité à 100%. Si des tests prouvent le contraire, le produit sera remplacé ou remboursé intégralement.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                9. Propriété Intellectuelle
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Tous les éléments du site www.sunushop.sn (textes, images, logos, vidéos, etc.) sont protégés par le droit d'auteur, le droit des marques et/ou tout autre droit de propriété intellectuelle. Toute reproduction, représentation, modification, publication, adaptation totale ou partielle est strictement interdite sans l'autorisation écrite préalable de Sunu Shop.
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                Les marques et logos "Sunu Shop" ainsi que tous les autres signes distinctifs figurant sur le site sont des marques déposées. Toute utilisation non autorisée constitue une contrefaçon sanctionnée par le Code de la Propriété Intellectuelle sénégalais.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                10. Responsabilité
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Sunu Shop met tout en œuvre pour assurer l'exactitude des informations diffusées sur le site. Toutefois, nous ne pouvons garantir l'absence totale d'erreurs. Les photographies des produits ne sont pas contractuelles.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Sunu Shop ne saurait être tenue responsable de :
              </p>
              <ul className="text-gray-500 flex flex-col gap-2 pl-6">
                <li>L'impossibilité d'accéder temporairement au site pour des raisons de maintenance ou de force majeure</li>
                <li>L'utilisation frauduleuse du site par des tiers</li>
                <li>Les dommages indirects résultant de l'utilisation du site ou des produits</li>
                <li>Les retards de livraison dus à des circonstances indépendantes de notre volonté</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                11. Protection des Données Personnelles
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Le traitement des données personnelles est régi par notre <a href="/politique-de-confidentialite" style={{ color: '#009A44' }}>Politique de Confidentialité</a>. En passant commande, le Client consent au traitement de ses données personnelles conformément à cette politique.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                12. Droit Applicable et Règlement des Litiges
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Les présentes CGV sont soumises au droit sénégalais. En cas de litige, le Client s'engage à contacter en priorité le service client de Sunu Shop afin de rechercher une solution amiable : contact@sunushop.sn
              </p>
              <p className="text-gray-500 leading-relaxed mb-0">
                À défaut d'accord amiable, tout litige relatif à l'interprétation ou à l'exécution des présentes sera porté devant les tribunaux compétents de Dakar, Sénégal.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                13. Modifications des CGV
              </h2>
              <p className="text-gray-500 leading-relaxed mb-0">
                Sunu Shop se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables sont celles en vigueur à la date de la commande.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 20, backgroundColor: '#009A44' }} />
                14. Contact
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <p className="font-medium mb-2">Sunu Shop SARL</p>
                <p className="text-gray-500 text-sm mb-1">Adresse : Dakar, Sénégal</p>
                <p className="text-gray-500 text-sm mb-1">E-mail : <a href="mailto:contact@sunushop.sn" style={{ color: '#009A44' }}>contact@sunushop.sn</a></p>
                <p className="text-gray-500 text-sm mb-1">Téléphone : +221 33 XXX XX XX</p>
                <p className="text-gray-500 text-sm mb-0">Service client : Lundi - Samedi, 9h - 18h</p>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}
