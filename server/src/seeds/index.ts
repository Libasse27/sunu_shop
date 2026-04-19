import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Product from '../models/Product.model';
import Service from '../models/Service.model';
import { createSlug } from '../utils/slugify';

const categories = [
  {
    name: 'Informatique',
    slug: 'informatique',
    description: 'Ordinateurs portables, PC de bureau, serveurs et matériel informatique',
    icon: '💻',
    order: 1,
    children: [
      { name: 'Ordinateurs Portables', slug: 'ordinateurs-portables', description: 'Laptops et ultrabooks pour tous les usages' },
      { name: 'PC de Bureau', slug: 'pc-bureau', description: 'Ordinateurs fixes et tours complets' },
      { name: 'Composants PC', slug: 'composants-pc', description: 'Processeurs, RAM, SSD et composants' },
      { name: 'Imprimantes & Scanners', slug: 'imprimantes-scanners', description: 'Imprimantes jet d\'encre, laser et scanners' },
    ],
  },
  {
    name: 'Téléphonie Mobile',
    slug: 'telephones',
    description: 'Smartphones, téléphones basiques et accessoires mobiles',
    icon: '📱',
    order: 2,
    children: [
      { name: 'Smartphones Android', slug: 'smartphones-android', description: 'Samsung, Xiaomi, Tecno, Infinix et plus' },
      { name: 'iPhone Apple', slug: 'iphones', description: 'iPhone dernière génération et reconditionné' },
      { name: 'Téléphones Basiques', slug: 'telephones-basiques', description: 'Téléphones simples et résistants' },
    ],
  },
  {
    name: 'Électronique & TV',
    slug: 'electronique',
    description: 'Télévisions, audio, home cinéma et électronique grand public',
    icon: '📺',
    order: 3,
    children: [
      { name: 'Téléviseurs', slug: 'televiseurs', description: 'TV LED, OLED et Smart TV' },
      { name: 'Audio & Son', slug: 'audio-son', description: 'Enceintes, casques et systèmes audio' },
      { name: 'Décodeurs & Box', slug: 'decodeurs-box', description: 'Décodeurs TNT, sat et box internet' },
    ],
  },
  {
    name: 'Électroménager',
    slug: 'electromenager',
    description: 'Réfrigérateurs, machines à laver, climatiseurs et appareils ménagers',
    icon: '🏠',
    order: 4,
    children: [
      { name: 'Réfrigérateurs', slug: 'refrigerateurs', description: 'Frigos et congélateurs toutes capacités' },
      { name: 'Climatiseurs', slug: 'climatiseurs', description: 'Clims split, monobloc et portables' },
      { name: 'Machines à Laver', slug: 'machines-a-laver', description: 'Lave-linge frontal et top' },
    ],
  },
  {
    name: 'Accessoires & Câbles',
    slug: 'accessoires',
    description: 'Câbles, chargeurs, souris, claviers et accessoires tech',
    icon: '🖱️',
    order: 5,
    children: [
      { name: 'Claviers & Souris', slug: 'claviers-souris', description: 'Périphériques filaires et sans fil' },
      { name: 'Câbles & Chargeurs', slug: 'cables-chargeurs', description: 'Câbles USB, HDMI, chargeurs et multiprises' },
      { name: 'Stockage', slug: 'stockage', description: 'Disques durs, clés USB et cartes mémoire' },
    ],
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Consoles, manettes, jeux vidéo et accessoires gaming',
    icon: '🎮',
    order: 6,
    children: [
      { name: 'Consoles de Jeux', slug: 'consoles-jeux', description: 'PlayStation, Xbox et Nintendo' },
      { name: 'PC Gaming', slug: 'pc-gaming', description: 'Ordinateurs gaming haute performance' },
      { name: 'Accessoires Gaming', slug: 'accessoires-gaming', description: 'Manettes, casques gaming et sièges' },
    ],
  },
  {
    name: 'Caméra & Surveillance',
    slug: 'cameras',
    description: 'Caméras de surveillance IP et analogiques, enregistreurs NVR/DVR, systèmes de sécurité pour maison et entreprise',
    icon: '📷',
    order: 7,
    children: [
      { name: 'Caméras IP', slug: 'cameras-ip', description: 'Caméras réseau WiFi et filaires haute définition' },
      { name: 'Caméras Analogiques', slug: 'cameras-analogiques', description: 'Caméras CCTV HD-TVI, AHD et CVI' },
      { name: 'Enregistreurs NVR/DVR', slug: 'enregistreurs-nvr-dvr', description: 'Enregistreurs réseau et numériques pour stockage des vidéos' },
      { name: 'Accessoires Surveillance', slug: 'accessoires-surveillance', description: 'Câbles, alimentations, moniteurs et accessoires CCTV' },
    ],
  },
];

const services = [
  {
    title: 'Réparation Ordinateur',
    slug: 'reparation-ordinateur',
    description: 'Diagnostic complet et réparation de tous types d\'ordinateurs portables et fixes. Remplacement de pièces : écran, clavier, batterie, disque dur, RAM. Réinstallation du système d\'exploitation Windows ou Linux. Nettoyage interne et optimisation des performances. Nos techniciens certifiés prennent en charge votre appareil avec soin.',
    shortDescription: 'Diagnostic et réparation de PC portables et fixes par nos techniciens certifiés',
    category: 'Informatique',
    startingPrice: 15000,
    estimatedDuration: '1 à 3 jours ouvrés',
    isAvailable: true,
    order: 1,
    whatsappMessage: 'Bonjour TechAfrique, j\'ai besoin d\'une réparation pour mon ordinateur.',
    features: ['Diagnostic gratuit', 'Pièces de remplacement originales', 'Garantie 3 mois', 'Devis avant intervention'],
    image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=600',
  },
  {
    title: 'Réparation Téléphone/Smartphone',
    slug: 'reparation-telephone',
    description: 'Réparation de smartphones toutes marques : Samsung, iPhone, Xiaomi, Tecno, Infinix et autres. Remplacement d\'écran cassé, réparation de la batterie, déblocage réseau, problèmes logiciels et virus. Service rapide avec prise en charge express sous 24h disponible.',
    shortDescription: 'Réparation rapide de smartphones toutes marques, remplacement écran et batterie',
    category: 'Téléphonie',
    startingPrice: 10000,
    estimatedDuration: '2h à 1 jour ouvré',
    isAvailable: true,
    order: 2,
    whatsappMessage: 'Bonjour TechAfrique, j\'ai besoin d\'une réparation pour mon téléphone.',
    features: ['Remplacement écran', 'Changement batterie', 'Déblocage réseau', 'Récupération données'],
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
  },
  {
    title: 'Installation Caméra & Vidéosurveillance',
    slug: 'installation-camera',
    description: 'Installation complète de systèmes de vidéosurveillance pour maisons, boutiques et entreprises. Caméras IP, analogiques, dôme ou bullet. Configuration du NVR/DVR, accès à distance depuis votre smartphone. Câblage soigné et discret. Conseils personnalisés selon votre sécurité.',
    shortDescription: 'Installation de systèmes de vidéosurveillance pour maison et entreprise',
    category: 'Installation',
    startingPrice: 50000,
    estimatedDuration: '1 à 2 jours',
    isAvailable: true,
    order: 3,
    whatsappMessage: 'Bonjour TechAfrique, je souhaite installer un système de caméras de surveillance.',
    features: ['Audit sécurité gratuit', 'Caméras HD/4K', 'Accès smartphone', 'Garantie installation'],
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600',
  },
  {
    title: 'Installation Réseau & Wi-Fi',
    slug: 'installation-reseau',
    description: 'Installation et configuration de réseaux informatiques filaires et sans fil. Mise en place de routeurs, switches, points d\'accès Wi-Fi. Extension de couverture Wi-Fi dans grands espaces. Configuration VPN, sécurisation du réseau, partage d\'imprimante et NAS. Service pour particuliers et entreprises.',
    shortDescription: 'Installation et configuration de réseaux Wi-Fi et filaires pour maison et entreprise',
    category: 'Installation',
    startingPrice: 25000,
    estimatedDuration: '4h à 1 jour',
    isAvailable: true,
    order: 4,
    whatsappMessage: 'Bonjour TechAfrique, je voudrais installer un réseau Wi-Fi.',
    features: ['Audit réseau', 'Configuration sécurisée', 'Couverture optimale', 'Support après installation'],
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600',
  },
  {
    title: 'Récupération de Données',
    slug: 'recuperation-donnees',
    description: 'Récupération de données sur disques durs défaillants, SSD, clés USB, cartes mémoire et téléphones. Disque dur qui ne démarre plus, partition corrompue, suppression accidentelle, formatage. Diagnostic préalable gratuit pour évaluer les chances de récupération. Taux de réussite élevé sur la plupart des pannes.',
    shortDescription: 'Récupération de données sur disques durs, SSD, téléphones et supports de stockage',
    category: 'Informatique',
    startingPrice: 20000,
    estimatedDuration: '2 à 5 jours ouvrés',
    isAvailable: true,
    order: 5,
    whatsappMessage: 'Bonjour TechAfrique, j\'ai perdu des données importantes et j\'ai besoin d\'aide.',
    features: ['Diagnostic gratuit', 'Aucun frais si échec', 'Confidentialité garantie', 'Rapport détaillé'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  },
  {
    title: 'Maintenance Préventive PC',
    slug: 'maintenance-preventive',
    description: 'Service de maintenance préventive pour prolonger la durée de vie de votre ordinateur. Nettoyage interne de la poussière, remplacement de la pâte thermique, mise à jour des pilotes et du système. Optimisation logicielle, suppression des malwares et programmes indésirables. Vérification complète du matériel.',
    shortDescription: 'Entretien complet de votre PC : nettoyage, optimisation et mise à jour',
    category: 'Informatique',
    startingPrice: 10000,
    estimatedDuration: '2 à 4 heures',
    isAvailable: true,
    order: 6,
    whatsappMessage: 'Bonjour TechAfrique, je voudrais faire entretenir mon ordinateur.',
    features: ['Nettoyage interne', 'Optimisation système', 'Mise à jour drivers', 'Rapport d\'état'],
    image: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=600',
  },
];

const generateProducts = (categoryMap: Record<string, string>, subCategoryMap: Record<string, string>) => [
  // Informatique — Ordinateurs Portables
  {
    name: 'Laptop ASUS VivoBook 15 — Intel Core i5 12e Gen',
    description: 'Ordinateur portable ASUS VivoBook 15 avec processeur Intel Core i5 de 12e génération. Idéal pour le travail, les études et le multimédia. Écran Full HD IPS 15.6 pouces anti-reflets. Clavier rétroéclairé, lecteur d\'empreinte digitale. Batterie longue durée jusqu\'à 10h. WiFi 6, Bluetooth 5.0.',
    shortDescription: 'ASUS VivoBook 15 — Intel i5 12e Gen, 8Go RAM, 512Go SSD',
    sku: 'LAP-ASUS-VB15-001',
    price: 380000,
    compareAtPrice: 420000,
    category: categoryMap['Informatique'],
    subCategory: subCategoryMap['Ordinateurs Portables'],
    images: [{ url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600', isPrimary: true, order: 0, alt: 'ASUS VivoBook 15' }],
    tags: ['laptop', 'asus', 'vivobook', 'intel', 'i5', 'windows'],
    specifications: [
      { key: 'Processeur', value: 'Intel Core i5-1235U (12e Gen)' },
      { key: 'RAM', value: '8 Go DDR4' },
      { key: 'Stockage', value: '512 Go SSD NVMe' },
      { key: 'Écran', value: '15.6" Full HD IPS (1920x1080)' },
      { key: 'Système', value: 'Windows 11 Home' },
      { key: 'Batterie', value: '42 Wh — jusqu\'à 10h' },
      { key: 'Connectivité', value: 'WiFi 6, Bluetooth 5.0, USB-C' },
      { key: 'Garantie', value: '1 an constructeur' },
    ],
    stock: 15, brand: 'ASUS', weight: 1800,
    rating: 4.5, numReviews: 42, totalSold: 28, isFeatured: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'MacBook Air M2 — 13 pouces 2023',
    description: 'Le MacBook Air avec la puce Apple M2 révolutionnaire. Design ultra-fin et ultra-léger. Autonomie extraordinaire de 18 heures. Écran Liquid Retina 13.6 pouces. Recharge MagSafe rapide. Caméra FaceTime 1080p. Idéal pour les professionnels créatifs et les étudiants exigeants.',
    shortDescription: 'Apple MacBook Air M2 — 8Go RAM, 256Go SSD, 13.6" Retina',
    sku: 'LAP-APL-MBA-M2-001',
    price: 950000,
    compareAtPrice: 1050000,
    category: categoryMap['Informatique'],
    subCategory: subCategoryMap['Ordinateurs Portables'],
    images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', isPrimary: true, order: 0, alt: 'MacBook Air M2' }],
    tags: ['macbook', 'apple', 'm2', 'macos', 'ultrabook'],
    specifications: [
      { key: 'Processeur', value: 'Apple M2 (8 cœurs CPU)' },
      { key: 'RAM', value: '8 Go Unified Memory' },
      { key: 'Stockage', value: '256 Go SSD' },
      { key: 'Écran', value: '13.6" Liquid Retina (2560x1664)' },
      { key: 'Système', value: 'macOS Ventura' },
      { key: 'Batterie', value: '52.6 Wh — jusqu\'à 18h' },
      { key: 'Connectivité', value: 'WiFi 6, Bluetooth 5.3, MagSafe 3' },
    ],
    stock: 8, brand: 'Apple', weight: 1240,
    rating: 4.9, numReviews: 67, totalSold: 34, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'HP EliteBook 840 G9 — Professionnel',
    description: 'PC portable professionnel HP EliteBook 840 G9. Certifié MIL-STD-810H pour résister aux conditions difficiles. Lecteur d\'empreinte, caméra infrarouge Windows Hello, écran anti-espion HP Sure View intégré. Gestion à distance HP Wolf Security. Idéal pour les entreprises.',
    shortDescription: 'HP EliteBook 840 G9 — Intel i7, 16Go RAM, 512Go SSD, certifié pro',
    sku: 'LAP-HP-EB840-001',
    price: 680000,
    category: categoryMap['Informatique'],
    subCategory: subCategoryMap['Ordinateurs Portables'],
    images: [{ url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600', isPrimary: true, order: 0, alt: 'HP EliteBook 840' }],
    tags: ['hp', 'elitebook', 'professionnel', 'intel', 'i7', 'windows'],
    specifications: [
      { key: 'Processeur', value: 'Intel Core i7-1265U (12e Gen)' },
      { key: 'RAM', value: '16 Go DDR5' },
      { key: 'Stockage', value: '512 Go SSD NVMe' },
      { key: 'Écran', value: '14" Full HD IPS (1920x1080)' },
      { key: 'Système', value: 'Windows 11 Pro' },
      { key: 'Garantie', value: '3 ans constructeur' },
    ],
    stock: 5, brand: 'HP', weight: 1370,
    rating: 4.7, numReviews: 23, totalSold: 12, isFeatured: false, isNewArrival: true,
  },

  // Téléphonie Mobile — Smartphones
  {
    name: 'Samsung Galaxy S23 FE — 256 Go',
    description: 'Samsung Galaxy S23 Fan Edition, le flagship accessible. Processeur Exynos 2200, écran Super AMOLED 120Hz, triple caméra 50MP OIS. Charge rapide 25W, charge sans fil. IP68 résistance à l\'eau. Garantie Samsung 2 ans. Disponible en noir, crème et bleu.',
    shortDescription: 'Samsung Galaxy S23 FE — 8Go RAM, 256Go, triple caméra 50MP',
    sku: 'PHN-SAM-S23FE-256-001',
    price: 280000,
    compareAtPrice: 320000,
    category: categoryMap['Téléphonie Mobile'],
    subCategory: subCategoryMap['Smartphones Android'],
    images: [{ url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', isPrimary: true, order: 0, alt: 'Samsung Galaxy S23 FE' }],
    tags: ['samsung', 'galaxy', 's23', 'android', 'smartphone'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Graphite', priceModifier: 0, stock: 10 }, { value: 'Crème', priceModifier: 0, stock: 8 }, { value: 'Bleu indigo', priceModifier: 0, stock: 6 }] },
    ],
    specifications: [
      { key: 'Processeur', value: 'Exynos 2200' },
      { key: 'RAM', value: '8 Go' },
      { key: 'Stockage', value: '256 Go (extensible)' },
      { key: 'Écran', value: '6.4" Dynamic AMOLED 120Hz' },
      { key: 'Caméra principale', value: '50 MP OIS + 12 MP + 8 MP' },
      { key: 'Batterie', value: '4 500 mAh — charge 25W' },
      { key: 'OS', value: 'Android 13, One UI 5.1' },
      { key: 'Résistance', value: 'IP68' },
    ],
    stock: 24, brand: 'Samsung', weight: 177,
    rating: 4.6, numReviews: 89, totalSold: 67, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro — 128 Go',
    description: 'Excellent rapport qualité-prix avec le Redmi Note 13 Pro. Capteur photo 200MP impressionnant, charge ultra-rapide 67W, écran AMOLED 120Hz. Processeur Snapdragon 7s Gen 2 performant. Conception premium en verre. Idéal pour les amateurs de photo.',
    shortDescription: 'Xiaomi Redmi Note 13 Pro — 8Go RAM, 128Go, caméra 200MP',
    sku: 'PHN-XIA-RN13P-128-001',
    price: 185000,
    compareAtPrice: 210000,
    category: categoryMap['Téléphonie Mobile'],
    subCategory: subCategoryMap['Smartphones Android'],
    images: [{ url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600', isPrimary: true, order: 0, alt: 'Xiaomi Redmi Note 13 Pro' }],
    tags: ['xiaomi', 'redmi', 'note13', 'android', 'photo'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Noir', priceModifier: 0, stock: 15 }, { value: 'Vert forêt', priceModifier: 0, stock: 10 }] },
    ],
    specifications: [
      { key: 'Processeur', value: 'Snapdragon 7s Gen 2' },
      { key: 'RAM', value: '8 Go LPDDR5' },
      { key: 'Stockage', value: '128 Go UFS 2.2' },
      { key: 'Écran', value: '6.67" AMOLED 120Hz (2712x1220)' },
      { key: 'Caméra principale', value: '200 MP + 8 MP ultra-large + 2 MP' },
      { key: 'Batterie', value: '5 100 mAh — charge 67W' },
      { key: 'OS', value: 'Android 13, MIUI 14' },
    ],
    stock: 30, brand: 'Xiaomi', weight: 187,
    rating: 4.5, numReviews: 145, totalSold: 112, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'iPhone 15 — 128 Go',
    description: 'iPhone 15 avec Dynamic Island et port USB-C. Puce A16 Bionic ultra-rapide. Caméra principale 48MP avec mode portrait amélioré. Design en aluminium avec dos en verre coloré. Crash Detection et Emergency SOS par satellite. iOS 17 avec de nombreuses nouveautés.',
    shortDescription: 'Apple iPhone 15 — 6Go RAM, 128Go, caméra 48MP, USB-C',
    sku: 'PHN-APL-IP15-128-001',
    price: 620000,
    category: categoryMap['Téléphonie Mobile'],
    subCategory: subCategoryMap['iPhone Apple'],
    images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', isPrimary: true, order: 0, alt: 'iPhone 15' }],
    tags: ['iphone', 'apple', 'ios', 'usb-c', 'dynamic-island'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Noir', priceModifier: 0, stock: 5 }, { value: 'Bleu', priceModifier: 0, stock: 4 }, { value: 'Rose', priceModifier: 0, stock: 3 }, { value: 'Jaune', priceModifier: 0, stock: 3 }] },
    ],
    specifications: [
      { key: 'Processeur', value: 'Apple A16 Bionic' },
      { key: 'RAM', value: '6 Go' },
      { key: 'Stockage', value: '128 Go' },
      { key: 'Écran', value: '6.1" Super Retina XDR OLED' },
      { key: 'Caméra principale', value: '48 MP (f/1.6) + 12 MP ultra-large' },
      { key: 'Batterie', value: '3 349 mAh — jusqu\'à 20h vidéo' },
      { key: 'OS', value: 'iOS 17' },
      { key: 'Connecteur', value: 'USB-C' },
    ],
    stock: 15, brand: 'Apple', weight: 171,
    rating: 4.8, numReviews: 56, totalSold: 38, isFeatured: true, isNewArrival: true,
  },

  // Électronique — TV
  {
    name: 'Samsung Smart TV 55" 4K UHD',
    description: 'Téléviseur Samsung Crystal 4K UHD 55 pouces. Technologie Crystal Processor 4K pour des images éclatantes. Smart TV Tizen avec accès Netflix, YouTube, Prime Video. Dolby Digital Plus, HDR10+. 3 ports HDMI, 2 USB. Idéal pour la maison et le bureau.',
    shortDescription: 'Samsung 55" 4K UHD Smart TV — Crystal Processor, HDR10+, Tizen OS',
    sku: 'TV-SAM-55-4K-001',
    price: 520000,
    compareAtPrice: 600000,
    category: categoryMap['Électronique & TV'],
    subCategory: subCategoryMap['Téléviseurs'],
    images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600', isPrimary: true, order: 0, alt: 'Samsung Smart TV 55"' }],
    tags: ['tv', 'samsung', '4k', 'smart-tv', 'uhd'],
    specifications: [
      { key: 'Taille', value: '55 pouces (138 cm)' },
      { key: 'Résolution', value: '4K UHD (3840x2160)' },
      { key: 'Processeur', value: 'Crystal Processor 4K' },
      { key: 'HDR', value: 'HDR10+' },
      { key: 'Système', value: 'Smart TV Tizen' },
      { key: 'Connectique', value: '3x HDMI, 2x USB, WiFi, Bluetooth' },
      { key: 'Son', value: '20W — Dolby Digital Plus' },
    ],
    stock: 10, brand: 'Samsung', weight: 15500,
    rating: 4.6, numReviews: 78, totalSold: 45, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Enceinte Bluetooth JBL Charge 5',
    description: 'Enceinte portable JBL Charge 5 avec son puissant de 40W. Résistante à l\'eau et à la poussière IP67. Autonomie 20 heures. Charge votre téléphone via USB. Idéale pour le plein air, la plage et les voyages. Tweeter dédié pour les aigus. Compatible iOS et Android.',
    shortDescription: 'JBL Charge 5 — Enceinte Bluetooth portable 40W, IP67, 20h autonomie',
    sku: 'AUD-JBL-CHG5-001',
    price: 95000,
    compareAtPrice: 115000,
    category: categoryMap['Électronique & TV'],
    subCategory: subCategoryMap['Audio & Son'],
    images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600', isPrimary: true, order: 0, alt: 'JBL Charge 5' }],
    tags: ['enceinte', 'jbl', 'bluetooth', 'portable', 'ip67'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Noir', priceModifier: 0, stock: 12 }, { value: 'Bleu', priceModifier: 0, stock: 8 }, { value: 'Rouge', priceModifier: 0, stock: 6 }] },
    ],
    specifications: [
      { key: 'Puissance', value: '40W RMS' },
      { key: 'Résistance', value: 'IP67 (eau et poussière)' },
      { key: 'Batterie', value: '7 500 mAh — 20h autonomie' },
      { key: 'Connectivité', value: 'Bluetooth 5.3, USB-C' },
      { key: 'Fonction', value: 'Power bank intégré' },
    ],
    stock: 26, brand: 'JBL', weight: 960,
    rating: 4.7, numReviews: 123, totalSold: 89, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },

  // Électroménager
  {
    name: 'Réfrigérateur Samsung 385L No-Frost',
    description: 'Réfrigérateur Samsung combiné 385L avec technologie No-Frost pour éliminer le givrage. Compartiment réfrigérateur 254L + congélateur 131L. Digital Inverter Compressor pour économies d\'énergie et silencieux. Classe énergétique A+. Garantie compresseur 10 ans.',
    shortDescription: 'Samsung Combiné 385L No-Frost — Digital Inverter, A+, garantie 10 ans',
    sku: 'ELM-SAM-FRIGO-385-001',
    price: 420000,
    compareAtPrice: 490000,
    category: categoryMap['Électroménager'],
    subCategory: subCategoryMap['Réfrigérateurs'],
    images: [{ url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600', isPrimary: true, order: 0, alt: 'Samsung Réfrigérateur' }],
    tags: ['réfrigérateur', 'samsung', 'no-frost', 'combiné', 'a+'],
    specifications: [
      { key: 'Capacité totale', value: '385 litres' },
      { key: 'Réfrigérateur', value: '254 litres' },
      { key: 'Congélateur', value: '131 litres' },
      { key: 'Technologie', value: 'No-Frost Total' },
      { key: 'Compresseur', value: 'Digital Inverter — garantie 10 ans' },
      { key: 'Classe énergie', value: 'A+' },
      { key: 'Bruit', value: '36 dB' },
    ],
    stock: 6, brand: 'Samsung', weight: 68000,
    rating: 4.5, numReviews: 34, totalSold: 18, isFeatured: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Climatiseur Midea 1.5 CV Inverter',
    description: 'Climatiseur split Midea 1.5 CV technologie Inverter pour des économies d\'énergie jusqu\'à 60%. Fonction chaud/froid, mode turbo, déshumidification. WiFi intégré, contrôle par smartphone. Filtre anti-bactérien. Installation incluse dans le prix. Garantie 2 ans pièces et main d\'œuvre.',
    shortDescription: 'Midea Inverter 1.5 CV Chaud/Froid — WiFi, filtre anti-bactérien, installation incluse',
    sku: 'ELM-MID-CLIM-15-001',
    price: 350000,
    category: categoryMap['Électroménager'],
    subCategory: subCategoryMap['Climatiseurs'],
    images: [{ url: 'https://images.unsplash.com/photo-1631545804833-8cc0f20e1e00?w=600', isPrimary: true, order: 0, alt: 'Climatiseur Midea' }],
    tags: ['climatiseur', 'midea', 'inverter', 'wifi', 'chaud-froid'],
    specifications: [
      { key: 'Puissance', value: '1.5 CV (12 000 BTU)' },
      { key: 'Technologie', value: 'Inverter DC' },
      { key: 'Mode', value: 'Froid/Chaud/Ventilation/Déshumidification' },
      { key: 'Connectivité', value: 'WiFi — application Midea Air' },
      { key: 'Classe énergie', value: 'A++' },
      { key: 'Garantie', value: '2 ans pièces et main d\'œuvre' },
    ],
    stock: 8, brand: 'Midea', weight: 25000,
    rating: 4.4, numReviews: 21, totalSold: 14, isFeatured: false, isNewArrival: true,
  },

  // Accessoires
  {
    name: 'Souris Sans Fil Logitech MX Master 3S',
    description: 'Souris sans fil Logitech MX Master 3S, la référence pour les professionnels. Molette MagSpeed électromagnétique ultra-précise. Capteur optique 8000 DPI. Recharge USB-C rapide (1 min = 3h). Fonctionne sur toutes les surfaces, même le verre. Boutons personnalisables, compatible multi-appareils.',
    shortDescription: 'Logitech MX Master 3S — Sans fil, 8000 DPI, molette MagSpeed, USB-C',
    sku: 'ACC-LOG-MXM3S-001',
    price: 65000,
    compareAtPrice: 78000,
    category: categoryMap['Accessoires & Câbles'],
    subCategory: subCategoryMap['Claviers & Souris'],
    images: [{ url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', isPrimary: true, order: 0, alt: 'Logitech MX Master 3S' }],
    tags: ['souris', 'logitech', 'sans-fil', 'bluetooth', 'professionnel'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Noir graphite', priceModifier: 0, stock: 15 }, { value: 'Gris pale', priceModifier: 0, stock: 10 }] },
    ],
    specifications: [
      { key: 'Capteur', value: 'Darkfield 8000 DPI' },
      { key: 'Connectivité', value: 'Bluetooth, USB Logi Bolt' },
      { key: 'Batterie', value: '500 mAh — 70 jours autonomie' },
      { key: 'Recharge', value: 'USB-C (1 min = 3h usage)' },
      { key: 'Compatibilité', value: 'Windows, macOS, Linux, iPadOS' },
    ],
    stock: 25, brand: 'Logitech', weight: 141,
    rating: 4.8, numReviews: 67, totalSold: 52, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Disque SSD Externe 1 To Samsung T7',
    description: 'Disque SSD externe portable Samsung T7 1 To. Vitesses de transfert jusqu\'à 1050 Mo/s en lecture. Résistant aux chocs, design compact en aluminium. Cryptage AES 256 bits. Compatible USB 3.2 Gen 2. Idéal pour la sauvegarde et le transport de fichiers volumineux.',
    shortDescription: 'Samsung T7 SSD Externe 1 To — 1050Mo/s, USB 3.2, chiffrement AES',
    sku: 'ACC-SAM-T7-1TO-001',
    price: 78000,
    compareAtPrice: 92000,
    category: categoryMap['Accessoires & Câbles'],
    subCategory: subCategoryMap['Stockage'],
    images: [{ url: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=600', isPrimary: true, order: 0, alt: 'Samsung T7 SSD' }],
    tags: ['ssd', 'samsung', 'externe', 'stockage', 'usb3'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Bleu Indigo', priceModifier: 0, stock: 12 }, { value: 'Beige', priceModifier: 0, stock: 8 }] },
    ],
    specifications: [
      { key: 'Capacité', value: '1 To' },
      { key: 'Lecture', value: 'jusqu\'à 1 050 Mo/s' },
      { key: 'Écriture', value: 'jusqu\'à 1 000 Mo/s' },
      { key: 'Interface', value: 'USB 3.2 Gen 2 (10 Gbps)' },
      { key: 'Sécurité', value: 'Chiffrement AES 256 bits' },
      { key: 'Compatibilité', value: 'PC, Mac, Android, iOS' },
    ],
    stock: 20, brand: 'Samsung', weight: 58,
    rating: 4.7, numReviews: 95, totalSold: 74, isFeatured: false, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },

  // Caméra & Surveillance
  {
    name: 'Kit Vidéosurveillance Hikvision 4 Caméras 2MP',
    description: 'Kit complet de vidéosurveillance Hikvision avec 4 caméras dôme 2MP Full HD. Enregistreur DVR 4 voies avec disque dur 1To inclus. Vision nocturne infrarouge jusqu\'à 20 mètres. Accès à distance depuis smartphone via l\'application Hik-Connect. Installation rapide avec câbles BNC inclus. Idéal pour maisons, boutiques et petits bureaux. Étanche IP66 pour usage intérieur et extérieur.',
    shortDescription: 'Kit 4 caméras Hikvision 2MP Full HD — DVR, 1To, vision nocturne, accès smartphone',
    sku: 'CAM-HIK-KIT4-2MP-001',
    price: 185000,
    compareAtPrice: 220000,
    category: categoryMap['Caméra & Surveillance'],
    subCategory: subCategoryMap['Caméras Analogiques'],
    images: [{ url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600', isPrimary: true, order: 0, alt: 'Kit vidéosurveillance Hikvision' }],
    tags: ['camera', 'surveillance', 'hikvision', 'cctv', 'dvr', 'securite'],
    specifications: [
      { key: 'Résolution', value: '2MP Full HD (1080p)' },
      { key: 'Nombre de caméras', value: '4 caméras dôme' },
      { key: 'Enregistreur', value: 'DVR 4 voies Hikvision' },
      { key: 'Stockage', value: '1 To disque dur inclus' },
      { key: 'Vision nocturne', value: 'Infrarouge jusqu\'à 20m' },
      { key: 'Étanchéité', value: 'IP66 (intérieur & extérieur)' },
      { key: 'Accès distant', value: 'Application Hik-Connect iOS/Android' },
      { key: 'Garantie', value: '2 ans constructeur' },
    ],
    stock: 12, brand: 'Hikvision', weight: 5500,
    rating: 4.6, numReviews: 38, totalSold: 24, isFeatured: true, isNewArrival: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Caméra IP WiFi Extérieure Reolink 4MP',
    description: 'Caméra de surveillance IP WiFi Reolink 4MP avec vision nocturne couleur. Détection intelligente de personnes et de véhicules. Alerte push en temps réel sur smartphone. Enregistrement sur carte SD (128Go max) ou cloud. Audio bidirectionnel intégré. Résistante aux intempéries IP67. Compatible Google Home et Alexa.',
    shortDescription: 'Reolink 4MP WiFi — Vision nocturne couleur, détection IA, audio bidirectionnel',
    sku: 'CAM-REO-IP4MP-EXT-001',
    price: 45000,
    compareAtPrice: 58000,
    category: categoryMap['Caméra & Surveillance'],
    subCategory: subCategoryMap['Caméras IP'],
    images: [{ url: 'https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?w=600', isPrimary: true, order: 0, alt: 'Caméra IP Reolink' }],
    tags: ['camera', 'ip', 'wifi', 'reolink', 'exterieur', 'surveillance'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Blanc', priceModifier: 0, stock: 20 }, { value: 'Noir', priceModifier: 0, stock: 15 }] },
    ],
    specifications: [
      { key: 'Résolution', value: '4MP (2560x1440)' },
      { key: 'Connectivité', value: 'WiFi 2.4GHz / 5GHz' },
      { key: 'Vision nocturne', value: 'Couleur jusqu\'à 30m' },
      { key: 'Détection', value: 'IA — personnes et véhicules' },
      { key: 'Audio', value: 'Bidirectionnel intégré' },
      { key: 'Stockage', value: 'Carte SD jusqu\'à 128Go + Cloud' },
      { key: 'Étanchéité', value: 'IP67' },
      { key: 'Compatibilité', value: 'Google Home, Amazon Alexa' },
    ],
    stock: 35, brand: 'Reolink', weight: 380,
    rating: 4.7, numReviews: 62, totalSold: 48, isFeatured: true, isBestSeller: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  },

  // Gaming
  {
    name: 'Manette DualSense PlayStation 5',
    description: 'Manette DualSense officielle PlayStation 5. Retour haptique avancé et gâchettes adaptatives pour une immersion totale. Microphone intégré, prise casque 3.5mm. Batterie rechargeable USB-C. Compatible PS5 et PC (Steam). Expérience de jeu révolutionnaire.',
    shortDescription: 'Sony DualSense PS5 — Retour haptique, gâchettes adaptatives, USB-C',
    sku: 'GAM-SON-DUAL-001',
    price: 55000,
    category: categoryMap['Gaming'],
    subCategory: subCategoryMap['Consoles de Jeux'],
    images: [{ url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600', isPrimary: true, order: 0, alt: 'DualSense PS5' }],
    tags: ['manette', 'playstation', 'ps5', 'dualsense', 'gaming'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Blanc/Noir', priceModifier: 0, stock: 20 }, { value: 'Midnight Black', priceModifier: 5000, stock: 10 }, { value: 'Cobalt Blue', priceModifier: 5000, stock: 8 }] },
    ],
    specifications: [
      { key: 'Compatibilité', value: 'PlayStation 5, PC (Steam)' },
      { key: 'Connexion', value: 'Bluetooth 5.1, USB-C filaire' },
      { key: 'Batterie', value: '1 560 mAh — 12h autonomie' },
      { key: 'Audio', value: 'Microphone + jack 3.5mm' },
      { key: 'Poids', value: '280g' },
    ],
    stock: 38, brand: 'Sony', weight: 280,
    rating: 4.9, numReviews: 178, totalSold: 134, isFeatured: true, isBestSeller: true, isNewArrival: false,
  },
  {
    name: 'Casque Gaming HyperX Cloud II',
    description: 'Casque gaming HyperX Cloud II avec son surround virtuel 7.1. Micro détachable avec suppression du bruit. Coussinets en mousse à mémoire de forme. Compatible PC, PS4/PS5, Xbox, Nintendo Switch et mobile. Audio Hi-Fi haute résolution. Solide et confortable pour de longues sessions.',
    shortDescription: 'HyperX Cloud II — Son 7.1, micro détachable, PC/PS5/Xbox/Switch',
    sku: 'GAM-HPX-CLDII-001',
    price: 48000,
    compareAtPrice: 60000,
    category: categoryMap['Gaming'],
    subCategory: subCategoryMap['Accessoires Gaming'],
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', isPrimary: true, order: 0, alt: 'HyperX Cloud II' }],
    tags: ['casque', 'hyperx', 'gaming', 'son-7.1', 'micro'],
    variants: [
      { name: 'Couleur', options: [{ value: 'Noir/Rouge', priceModifier: 0, stock: 15 }, { value: 'Blanc/Or', priceModifier: 0, stock: 10 }] },
    ],
    specifications: [
      { key: 'Son', value: 'Surround virtuel 7.1' },
      { key: 'Drivers', value: '53mm néodyme' },
      { key: 'Réponse fréquence', value: '15Hz - 25 000Hz' },
      { key: 'Micro', value: 'Détachable, anti-bruit' },
      { key: 'Compatibilité', value: 'PC, PS4/5, Xbox, Switch, Mobile' },
    ],
    stock: 25, brand: 'HyperX', weight: 320,
    rating: 4.6, numReviews: 84, totalSold: 61, isFeatured: false, isNewArrival: true, isOnSale: true,
    saleStartDate: new Date(), saleEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Service.deleteMany({}),
    ]);
    console.log('🗑️  Données existantes supprimées');

    // Create admin
    await User.create({
      firstName: 'Admin',
      lastName: 'TechAfrique',
      email: 'admin@techafrique.sn',
      password: 'Admin@123456',
      role: 'superadmin',
      isVerified: true,
    });
    console.log('👤 Admin créé (admin@techafrique.sn / Admin@123456)');

    // Create demo client
    await User.create({
      firstName: 'Moussa',
      lastName: 'Diallo',
      email: 'moussa@test.com',
      password: 'Client@123456',
      phone: '+221771234567',
      role: 'client',
      isVerified: true,
    });
    console.log('👤 Client test créé (moussa@test.com / Client@123456)');

    // Create categories
    const categoryMap: Record<string, string> = {};
    const subCategoryMap: Record<string, string> = {};

    for (const cat of categories) {
      const parent = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
        level: 0,
      });
      categoryMap[cat.name] = parent._id.toString();

      if (cat.children) {
        for (let i = 0; i < cat.children.length; i++) {
          const child = await Category.create({
            name: cat.children[i].name,
            slug: cat.children[i].slug,
            description: cat.children[i].description,
            parent: parent._id,
            level: 1,
            order: i,
          });
          subCategoryMap[cat.children[i].name] = child._id.toString();
        }
      }
    }
    console.log('📁 Catégories tech créées');

    // Create products
    const productData = generateProducts(categoryMap, subCategoryMap);
    for (const p of productData) {
      await Product.create({ ...p, slug: createSlug(p.name) });
    }
    console.log(`📦 ${productData.length} produits tech créés`);

    // Create services
    for (const s of services) {
      await Service.create(s);
    }
    console.log(`🔧 ${services.length} services créés`);

    console.log('\n✨ Seed TechAfrique terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
}

seed();
