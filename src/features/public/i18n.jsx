import { createContext, useContext, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SITE TRANSLATIONS
//
// Portuguese is the source language and doubles as the lookup key, so content.js
// stays readable PT. To translate a string, add an entry below keyed by its exact
// PT text with { en, fr, es }. Missing entries fall back to the PT text.
// The list of languages (LANGS) lives in content.js.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  // ── Nav ──
  'Home': { en: 'Home', fr: 'Accueil', es: 'Inicio' },
  'Adultos': { en: 'Adults', fr: 'Adultes', es: 'Adultos' },
  'Criança': { en: 'Kids', fr: 'Enfants', es: 'Niños' },
  'Empresas': { en: 'Companies', fr: 'Entreprises', es: 'Empresas' },
  'Campos': { en: 'Parks', fr: 'Parcs', es: 'Campos' },
  'Contactos': { en: 'Contact', fr: 'Contact', es: 'Contacto' },
  'Reservas': { en: 'Booking', fr: 'Réservation', es: 'Reservas' },
  'Reservar': { en: 'Book now', fr: 'Réserver', es: 'Reservar' },

  // ── Buttons / CTAs ──
  'Reservar agora': { en: 'Book now', fr: 'Réserver', es: 'Reservar ahora' },
  'Pedir reserva': { en: 'Request a booking', fr: 'Demander une réservation', es: 'Solicitar reserva' },
  'Pedir orçamento': { en: 'Request a quote', fr: 'Demander un devis', es: 'Solicitar presupuesto' },
  'Peça o seu orçamento': { en: 'Request your quote', fr: 'Demandez votre devis', es: 'Solicita tu presupuesto' },
  'Condições de reserva para empresas': { en: 'Company booking terms', fr: 'Conditions de réservation entreprises', es: 'Condiciones de reserva para empresas' },
  'Preencha o formulário e receberá o nosso orçamento o mais breve possível.': { en: 'Fill in the form and we’ll send you our quote as soon as possible.', fr: 'Remplissez le formulaire et vous recevrez notre devis dès que possible.', es: 'Rellena el formulario y recibirás nuestro presupuesto lo antes posible.' },

  // ── Home ──
  'PAINTBALL': { en: 'PAINTBALL', fr: 'PAINTBALL', es: 'PAINTBALL' },
  'LASERTAG': { en: 'LASERTAG', fr: 'LASERTAG', es: 'LÁSER TAG' },
  'MONITORIZAÇÃO': { en: 'SUPERVISION', fr: 'ENCADREMENT', es: 'SUPERVISIÓN' },
  'TEAMBUILDING': { en: 'TEAMBUILDING', fr: 'TEAMBUILDING', es: 'TEAMBUILDING' },
  'JOGOS À NOITE': { en: 'NIGHT GAMES', fr: 'JEUX DE NUIT', es: 'JUEGOS NOCTURNOS' },
  'ACTIVIDADES DE GRUPO': { en: 'GROUP ACTIVITIES', fr: 'ACTIVITÉS DE GROUPE', es: 'ACTIVIDADES DE GRUPO' },
  'PARA CRIANÇAS, ADULTOS E FAMÍLIAS': { en: 'FOR KIDS, ADULTS AND FAMILIES', fr: 'POUR ENFANTS, ADULTES ET FAMILLES', es: 'PARA NIÑOS, ADULTOS Y FAMILIAS' },
  'DIA E NOITE': { en: 'DAY AND NIGHT', fr: 'JOUR ET NUIT', es: 'DÍA Y NOCHE' },
  'EM TODOS OS JOGOS': { en: 'IN EVERY GAME', fr: 'DANS TOUS LES JEUX', es: 'EN TODOS LOS JUEGOS' },
  'PARA EMPRESAS': { en: 'FOR COMPANIES', fr: 'POUR ENTREPRISES', es: 'PARA EMPRESAS' },
  'PAINTBALL OU LASERTAG': { en: 'PAINTBALL OR LASERTAG', fr: 'PAINTBALL OU LASERTAG', es: 'PAINTBALL O LÁSER TAG' },
  'PARA ESCOLAS E EMPRESAS': { en: 'FOR SCHOOLS AND COMPANIES', fr: 'POUR ÉCOLES ET ENTREPRISES', es: 'PARA ESCUELAS Y EMPRESAS' },
  'FESTAS DE ANIVERSÁRIO': { en: 'BIRTHDAY PARTIES', fr: 'FÊTES D’ANNIVERSAIRE', es: 'FIESTAS DE CUMPLEAÑOS' },
  'DESPEDIDAS DE SOLTEIRO': { en: 'STAG & HEN PARTIES', fr: 'ENTERREMENTS DE VIE', es: 'DESPEDIDAS DE SOLTERO' },
  'EMPRESAS': { en: 'COMPANIES', fr: 'ENTREPRISES', es: 'EMPRESAS' },
  'GRUPOS': { en: 'GROUPS', fr: 'GROUPES', es: 'GRUPOS' },
  'Família e Amigos': { en: 'Family & Friends', fr: 'Famille & Amis', es: 'Familia y Amigos' },
  'As Nossas Actividades': { en: 'Our Activities', fr: 'Nos Activités', es: 'Nuestras Actividades' },
  'Clientes com experiências nos nossos parques': { en: 'Clients who’ve had experiences in our parks', fr: 'Des clients ayant vécu l’expérience dans nos parcs', es: 'Clientes con experiencias en nuestros parques' },
  'Diversão em segurança, com monitorização em todos os jogos.': { en: 'Safe fun, with supervision in every game.', fr: 'Du plaisir en toute sécurité, encadré à chaque jeu.', es: 'Diversión segura, con supervisión en cada juego.' },
  'BUBBLE FOOTBALL': { en: 'BUBBLE FOOTBALL', fr: 'BUBBLE FOOTBALL', es: 'BUBBLE FOOTBALL' },
  'E que tal um “Frente a Frente” com os seus amigos, família ou colegas de trabalho?':
    { en: 'How about a face-to-face with your friends, family or work colleagues?', fr: 'Et si vous faisiez un face-à-face avec vos amis, votre famille ou vos collègues ?', es: '¿Qué tal un cara a cara con tus amigos, familia o compañeros de trabajo?' },
  'Tem o sonho de pertencer à nossa seleção? Gosta de jogar futebol? Então imagine-se a jogar dentro de uma bolha!':
    { en: 'Dream of joining the national team? Love football? Then picture yourself playing inside a bubble!', fr: 'Vous rêvez de rejoindre la sélection ? Vous aimez le football ? Imaginez-vous jouer dans une bulle !', es: '¿Sueñas con jugar en la selección? ¿Te gusta el fútbol? ¡Imagínate jugando dentro de una burbuja!' },
  'Actividade de Lasertag num ambiente próprio e com presença de monitores.':
    { en: 'Lasertag in a dedicated setting, always with monitors present.', fr: 'Lasertag dans un cadre dédié, toujours en présence de moniteurs.', es: 'Láser tag en un entorno propio y siempre con monitores presentes.' },

  // ── Section / shared labels ──
  'Contacto Porto': { en: 'Porto Contact', fr: 'Contact Porto', es: 'Contacto Porto' },
  'Contacto Lisboa': { en: 'Lisbon Contact', fr: 'Contact Lisbonne', es: 'Contacto Lisboa' },
  'Desde': { en: 'From', fr: 'À partir de', es: 'Desde' },
  '/ pessoa': { en: '/ person', fr: '/ personne', es: '/ persona' },
  'Qualquer pack inclui': { en: 'Every pack includes', fr: 'Chaque pack comprend', es: 'Todos los packs incluyen' },
  'Actividades para grupos': { en: 'Group activities', fr: 'Activités de groupe', es: 'Actividades de grupo' },
  'Competências que reforça': { en: 'Skills it strengthens', fr: 'Compétences renforcées', es: 'Competencias que refuerza' },
  'Lisboa': { en: 'Lisbon', fr: 'Lisbonne', es: 'Lisboa' },
  'Porto': { en: 'Porto', fr: 'Porto', es: 'Oporto' },

  // ── Footer ──
  'Siga-nos': { en: 'Follow us', fr: 'Suivez-nous', es: 'Síguenos' },
  'Horários': { en: 'Opening Hours', fr: 'Horaires', es: 'Horarios' },
  'Links Úteis': { en: 'Useful Links', fr: 'Liens utiles', es: 'Enlaces útiles' },
  'Crianças': { en: 'Kids', fr: 'Enfants', es: 'Niños' },
  'Perguntas Frequentes': { en: 'FAQs', fr: 'FAQ', es: 'Preguntas frecuentes' },
  'Livro de Reclamações': { en: 'Complaints Book', fr: 'Livre de réclamations', es: 'Libro de reclamaciones' },
  'Política de Privacidade': { en: 'Privacy Policy', fr: 'Politique de confidentialité', es: 'Política de privacidad' },
  // ── Equipment page ──
  'Ver equipamento': { en: 'View equipment', fr: 'Voir l’équipement', es: 'Ver equipamiento' },
  'Ver convite de aniversário': { en: 'View birthday invitation', fr: 'Voir le carton d’invitation', es: 'Ver la invitación de cumpleaños' },
  'Convite Paintball Kids': { en: 'Paintball Kids Invitation', fr: 'Invitation Paintball Kids', es: 'Invitación Paintball Kids' },
  'Convite Lasertag Kids': { en: 'Lasertag Kids Invitation', fr: 'Invitation Lasertag Kids', es: 'Invitación Lasertag Kids' },
  'Convite Gelblast': { en: 'Gelblast Invitation', fr: 'Invitation Gelblast', es: 'Invitación Gelblast' },
  'Equipamento': { en: 'Equipment', fr: 'Équipement', es: 'Equipamiento' },
  'Equipamento para Adultos': { en: 'Equipment for Adults', fr: 'Équipement pour adultes', es: 'Equipamiento para adultos' },
  'Equipamento para Crianças': { en: 'Equipment for Children', fr: 'Équipement pour enfants', es: 'Equipamiento para niños' },
  'O material que faz parte de cada atividade.': { en: 'The gear included in each activity.', fr: 'Le matériel inclus dans chaque activité.', es: 'El material incluido en cada actividad.' },
  'Todas as atividades incluem': { en: 'Every activity includes', fr: 'Toutes les activités incluent', es: 'Todas las actividades incluyen' },
  'Voltar aos packs': { en: 'Back to packs', fr: 'Retour aux packs', es: 'Volver a los packs' },
  'Monitor Qualificado': { en: 'Qualified instructor', fr: 'Moniteur qualifié', es: 'Monitor cualificado' },
  'Seguro': { en: 'Insurance', fr: 'Assurance', es: 'Seguro' },
  'Queres o teu próprio material? Conhece a nossa loja online.': { en: 'Want your own gear? Check out our online store.', fr: 'Envie de votre propre matériel ? Découvrez notre boutique en ligne.', es: '¿Quieres tu propio material? Descubre nuestra tienda online.' },
  'Visitar a Loja Emboscada': { en: 'Visit the Emboscada Store', fr: 'Visiter la boutique Emboscada', es: 'Visitar la tienda Emboscada' },
  'Consumos opcionais': { en: 'Optional extras', fr: 'Suppléments optionnels', es: 'Consumibles opcionales' },
  'Instalações': { en: 'Facilities', fr: 'Installations', es: 'Instalaciones' },
  'Disponível apenas no Parque de Monsanto (Lisboa).': { en: 'Available only at the Monsanto park (Lisbon).', fr: 'Disponible uniquement au parc de Monsanto (Lisbonne).', es: 'Disponible solo en el parque de Monsanto (Lisboa).' },
  'Zona de Lanches': { en: 'Snack Zone', fr: 'Zone de goûters', es: 'Zona de meriendas' },
  'Ver serviço de lanches': { en: 'View snack service', fr: 'Voir le service de goûters', es: 'Ver el servicio de meriendas' },
  'O Parque Emboscada agiliza a contratação do serviço de lanches nas opções Esquilo e Tenda. Para adicionar extras ou esclarecer dúvidas sobre o catering deve entrar em contacto com a responsável, Dália Fontes, via email.': { en: 'Emboscada Park streamlines booking the snack service in the Esquilo and Tenda options. To add extras or ask about the catering, contact the coordinator, Dália Fontes, by email.', fr: 'Le Parc Emboscada facilite la réservation du service de goûters dans les options Esquilo et Tenda. Pour ajouter des extras ou poser des questions sur le traiteur, contactez la responsable, Dália Fontes, par e-mail.', es: 'El Parque Emboscada agiliza la contratación del servicio de meriendas en las opciones Esquilo y Tenda. Para añadir extras o resolver dudas sobre el catering, contacta con la responsable, Dália Fontes, por correo electrónico.' },
  // ── Equipment / extras / facilities / snacks content ──
  'Marcador calibre 68': { en: 'Cal .68 marker', fr: 'Marqueur calibre 68', es: 'Marcador calibre 68' },
  'Máscara de Proteção Térmica': { en: 'Thermal protection mask', fr: 'Masque de protection thermique', es: 'Máscara de protección térmica' },
  'Luvas de Proteção': { en: 'Protective gloves', fr: 'Gants de protection', es: 'Guantes de protección' },
  'Battle Pack com potes de bolas': { en: 'Battle Pack with ball pods', fr: 'Battle Pack avec pots de billes', es: 'Battle Pack con botes de bolas' },
  'Marcador de Lasertag': { en: 'Lasertag marker', fr: 'Marqueur Lasertag', es: 'Marcador de Lasertag' },
  'Head Band': { en: 'Headband', fr: 'Bandeau', es: 'Cinta de cabeza' },
  'Braçadeira eletrónica (noivo/noiva)': { en: 'Electronic armband (groom/bride)', fr: 'Brassard électronique (marié/mariée)', es: 'Brazalete electrónico (novio/novia)' },
  'Touca higiénica': { en: 'Hygienic cap', fr: 'Charlotte hygiénique', es: 'Gorro higiénico' },
  'Bolas de Bubble Ball – 1,50 m de diâmetro': { en: 'Bubble balls – 1.50 m diameter', fr: 'Bulles Bubble Ball – 1,50 m de diamètre', es: 'Bolas Bubble Ball – 1,50 m de diámetro' },
  'Bola de futebol': { en: 'Football', fr: 'Ballon de football', es: 'Balón de fútbol' },
  'Marcador BLASTER de Baixo Impacto (6–9 anos)': { en: 'Low-impact BLASTER marker (ages 6–9)', fr: 'Marqueur BLASTER faible impact (6–9 ans)', es: 'Marcador BLASTER de bajo impacto (6–9 años)' },
  'Marcador calibre 50 VIPER (10–15 anos)': { en: 'Cal .50 VIPER marker (ages 10–15)', fr: 'Marqueur calibre 50 VIPER (10–15 ans)', es: 'Marcador calibre 50 VIPER (10–15 años)' },
  'Lanche / bolo de aniversário (opcional)': { en: 'Snack / birthday cake (optional)', fr: 'Goûter / gâteau d’anniversaire (optionnel)', es: 'Merienda / tarta de cumpleaños (opcional)' },
  'Lançador Gelblast de gel de água': { en: 'Gelblast water-gel launcher', fr: 'Lanceur Gelblast à billes de gel', es: 'Lanzador Gelblast de gel de agua' },
  'Fato macaco (aluguer)': { en: 'Coveralls (rental)', fr: 'Combinaison (location)', es: 'Mono (alquiler)' },
  'Luvas (aluguer)': { en: 'Gloves (rental)', fr: 'Gants (location)', es: 'Guantes (alquiler)' },
  'SUPER COMBO — Fato + Luvas (aluguer)': { en: 'SUPER COMBO — Coveralls + Gloves (rental)', fr: 'SUPER COMBO — Combinaison + Gants (location)', es: 'SÚPER COMBO — Mono + Guantes (alquiler)' },
  '500 bolas extra': { en: '500 extra balls', fr: '500 billes supplémentaires', es: '500 bolas extra' },
  '1000 bolas extra': { en: '1000 extra balls', fr: '1000 billes supplémentaires', es: '1000 bolas extra' },
  '2000 bolas extra': { en: '2000 extra balls', fr: '2000 billes supplémentaires', es: '2000 bolas extra' },
  '30 minutos extra (por jogador)': { en: '30 extra minutes (per player)', fr: '30 minutes supplémentaires (par joueur)', es: '30 minutos extra (por jugador)' },
  '60 minutos extra (por jogador)': { en: '60 extra minutes (per player)', fr: '60 minutes supplémentaires (par joueur)', es: '60 minutos extra (por jugador)' },
  '5 000 bolas de gel extra (10 carregamentos de 500)': { en: '5,000 extra gel balls (10 reloads of 500)', fr: '5 000 billes de gel supplémentaires (10 recharges de 500)', es: '5 000 bolas de gel extra (10 recargas de 500)' },
  '10 000 bolas de gel extra (20 carregamentos de 500)': { en: '10,000 extra gel balls (20 reloads of 500)', fr: '10 000 billes de gel supplémentaires (20 recharges de 500)', es: '10 000 bolas de gel extra (20 recargas de 500)' },
  'Espaço com 10 000 m² exterior e semicoberto': { en: '10,000 m² outdoor and semi-covered space', fr: 'Espace de 10 000 m² extérieur et semi-couvert', es: 'Espacio de 10 000 m² exterior y semicubierto' },
  'Blocos balneários de acesso partilhado (hóspedes do Parque de Campismo)': { en: 'Shared changing-room blocks (campsite guests)', fr: 'Blocs sanitaires à accès partagé (clients du camping)', es: 'Bloques de vestuarios de acceso compartido (huéspedes del camping)' },
  'Estacionamento gratuito limitado': { en: 'Limited free parking', fr: 'Stationnement gratuit limité', es: 'Aparcamiento gratuito limitado' },
  '3 cenários imersivos': { en: '3 immersive scenarios', fr: '3 scénarios immersifs', es: '3 escenarios inmersivos' },
  '3 cenários imersivos outdoor': { en: '3 immersive outdoor scenarios', fr: '3 scénarios immersifs en plein air', es: '3 escenarios inmersivos al aire libre' },
  'Zona de Jogadores': { en: 'Players’ area', fr: 'Zone joueurs', es: 'Zona de jugadores' },
  'Monsanto Villas Restaurante disponível no local (Parque de Campismo)': { en: 'Monsanto Villas Restaurante on-site (campsite)', fr: 'Monsanto Villas Restaurante sur place (camping)', es: 'Monsanto Villas Restaurante en el sitio (camping)' },
  'Acesso ao campo de futebol 5 x 5 – Outdoor': { en: 'Access to the 5-a-side football pitch – Outdoor', fr: 'Accès au terrain de football à 5 – Extérieur', es: 'Acceso al campo de fútbol 5 x 5 – Exterior' },
  'Tábua mista de salgados': { en: 'Mixed savoury platter', fr: 'Plateau d’amuse-bouches salés', es: 'Tabla mixta de salados' },
  'Mini pastelaria / biscoitos': { en: 'Mini pastries / biscuits', fr: 'Mini pâtisseries / biscuits', es: 'Mini pastelería / galletas' },
  'Tábua de mini pizzas': { en: 'Mini-pizza platter', fr: 'Plateau de mini pizzas', es: 'Tabla de mini pizzas' },
  'Batata chips': { en: 'Potato chips', fr: 'Chips', es: 'Patatas fritas' },
  'Pipocas': { en: 'Popcorn', fr: 'Pop-corn', es: 'Palomitas' },
  'Sumo sem gás e água lisa': { en: 'Still juice and water', fr: 'Jus sans gaz et eau plate', es: 'Zumo sin gas y agua' },
  'Tábua de mini salgados': { en: 'Mini savouries platter', fr: 'Plateau de mini amuse-bouches salés', es: 'Tabla de mini salados' },
  'Mini hambúrguer de vitela': { en: 'Mini veal burger', fr: 'Mini burger de veau', es: 'Mini hamburguesa de ternera' },
  'Tábua de pizza': { en: 'Pizza platter', fr: 'Plateau de pizza', es: 'Tabla de pizza' },
  'Brigadeiro individual': { en: 'Individual brigadeiro', fr: 'Brigadeiro individuel', es: 'Brigadeiro individual' },
  'Espetada de fruta': { en: 'Fruit skewer', fr: 'Brochette de fruits', es: 'Brocheta de fruta' },
  'Bolo de aniversário': { en: 'Birthday cake', fr: 'Gâteau d’anniversaire', es: 'Tarta de cumpleaños' },
  'Decoração base': { en: 'Basic decoration', fr: 'Décoration de base', es: 'Decoración básica' },
  'Fonte de chocolate com bolachas': { en: 'Chocolate fountain with biscuits', fr: 'Fontaine de chocolat avec biscuits', es: 'Fuente de chocolate con galletas' },
  // ── Lanches page ──
  'Lanches': { en: 'Snacks', fr: 'Goûters', es: 'Meriendas' },
  'Serviço de Lanches': { en: 'Snack Service', fr: 'Service de goûters', es: 'Servicio de meriendas' },
  'Menus de lanche para festas e grupos, servidos no Parque de Monsanto (Lisboa).': { en: 'Snack menus for parties and groups, served at the Monsanto park (Lisbon).', fr: 'Menus de goûter pour fêtes et groupes, servis au parc de Monsanto (Lisbonne).', es: 'Menús de merienda para fiestas y grupos, servidos en el parque de Monsanto (Lisboa).' },
  'Extras': { en: 'Extras', fr: 'Extras', es: 'Extras' },
  'por criança': { en: 'per child', fr: 'par enfant', es: 'por niño' },
  'Servidos até às 18h30, mediante encomenda com um mínimo de 48 horas úteis de antecedência. Serviço do Monsanto Villas Restaurante (Lisboa Camping & Bungalows), no Parque de Monsanto.': { en: 'Served until 6:30 PM, ordered at least 48 business hours in advance. Provided by Monsanto Villas Restaurante (Lisboa Camping & Bungalows), at the Monsanto park.', fr: 'Servis jusqu’à 18h30, sur commande au moins 48 heures ouvrables à l’avance. Assuré par le Monsanto Villas Restaurante (Lisboa Camping & Bungalows), au parc de Monsanto.', es: 'Servidos hasta las 18:30, con pedido mínimo de 48 horas hábiles de antelación. A cargo de Monsanto Villas Restaurante (Lisboa Camping & Bungalows), en el parque de Monsanto.' },
  'Verão': { en: 'Summer', fr: 'Été', es: 'Verano' },
  'Inverno': { en: 'Winter', fr: 'Hiver', es: 'Invierno' },
  '09:00 – 19:00': { en: '9 AM – 7 PM', fr: '9h00 – 19h00', es: '9:00 – 19:00' },
  '09:00 – 18:00': { en: '9 AM – 6 PM', fr: '9h00 – 18h00', es: '9:00 – 18:00' },
  'Empresa Certificada · Alvará RNAAT: 164/2021 · © Emboscada Parque Aventura':
    { en: 'Certified Company · RNAAT Licence: 164/2021 · © Emboscada Parque Aventura', fr: 'Entreprise certifiée · Licence RNAAT : 164/2021 · © Emboscada Parque Aventura', es: 'Empresa certificada · Licencia RNAAT: 164/2021 · © Emboscada Parque Aventura' },

  // ── Page titles / leads ──
  'Festas de aniversário e actividades seguras, pensadas para os mais novos.':
    { en: 'Birthday parties and safe activities designed for the youngest.', fr: "Fêtes d'anniversaire et activités sûres, pensées pour les plus jeunes.", es: 'Fiestas de cumpleaños y actividades seguras, pensadas para los más pequeños.' },
  'Adrenalina para grupos de amigos, despedidas de solteiro e colegas de trabalho.':
    { en: 'Adrenaline for groups of friends, stag/hen parties and work colleagues.', fr: "De l'adrénaline pour groupes d'amis, enterrements de vie et collègues.", es: 'Adrenalina para grupos de amigos, despedidas y compañeros de trabajo.' },
  'Team building que junta a equipa e liberta o espírito competitivo.':
    { en: 'Team building that brings the team together and unleashes their competitive spirit.', fr: "Du team building qui soude l'équipe et libère l'esprit de compétition.", es: 'Team building que une al equipo y libera el espíritu competitivo.' },
  'Dois parques para escolher — Monsanto (Lisboa) e Porto.':
    { en: 'Two parks to choose from — Monsanto (Lisbon) and Porto.', fr: 'Deux parcs au choix — Monsanto (Lisbonne) et Porto.', es: 'Dos parques para elegir — Monsanto (Lisboa) y Oporto.' },
  'Fala connosco para reservar ou tirar dúvidas.':
    { en: 'Get in touch to book or ask a question.', fr: 'Contactez-nous pour réserver ou poser une question.', es: 'Habla con nosotros para reservar o resolver dudas.' },
  'Pede a tua reserva e entramos em contacto para confirmar.':
    { en: 'Request your booking and we’ll get in touch to confirm.', fr: 'Faites votre demande et nous vous contacterons pour confirmer.', es: 'Solicita tu reserva y te contactaremos para confirmar.' },
  'As dúvidas mais comuns sobre as nossas actividades.':
    { en: 'The most common questions about our activities.', fr: 'Les questions les plus fréquentes sur nos activités.', es: 'Las dudas más comunes sobre nuestras actividades.' },

  // ── Age labels ──
  'A partir dos 16 anos': { en: 'Ages 16+', fr: 'À partir de 16 ans', es: 'A partir de 16 años' },
  'A partir dos 6 anos': { en: 'Ages 6+', fr: 'À partir de 6 ans', es: 'A partir de 6 años' },
  'Recomendável dos 6 aos 9 anos': { en: 'Recommended ages 6–9', fr: 'Recommandé de 6 à 9 ans', es: 'Recomendable de 6 a 9 años' },

  // ── Activity intros ──
  'Frente a frente com amigos, família ou colegas — em cenários imersivos e sempre com monitorização.':
    { en: 'Face to face with friends, family or colleagues — in immersive scenarios, always supervised.', fr: 'Face à face avec amis, famille ou collègues — dans des décors immersifs, toujours encadré.', es: 'Cara a cara con amigos, familia o colegas — en escenarios inmersivos y siempre con supervisión.' },
  'Lasertag outdoor em cenários imersivos, de dia ou à noite, com monitorização em todos os jogos.':
    { en: 'Outdoor lasertag in immersive scenarios, day or night, supervised in every game.', fr: 'Lasertag outdoor dans des décors immersifs, jour et nuit, encadré à chaque jeu.', es: 'Láser tag al aire libre en escenarios inmersivos, de día o de noche, con supervisión en cada juego.' },
  'Futebol dentro de uma bolha gigante. Bubble Football, Bowling, Sumo e King num campo 5x5.':
    { en: 'Football inside a giant bubble. Bubble Football, Bowling, Sumo and King on a 5x5 pitch.', fr: 'Du foot dans une bulle géante. Bubble Football, Bowling, Sumo et King sur un terrain 5x5.', es: 'Fútbol dentro de una burbuja gigante. Bubble Football, Bowling, Sumo y King en campo 5x5.' },
  'Paintball infantil com marcador Cal 50 (baixo impacto). Escalões MINI (6–9) e KIDS (10–15).':
    { en: 'Kids paintball with a Cal 50 marker (low impact). MINI (6–9) and KIDS (10–15) tiers.', fr: 'Paintball enfant avec marqueur Cal 50 (faible impact). Catégories MINI (6–9) et KIDS (10–15).', es: 'Paintball infantil con marcador Cal 50 (bajo impacto). Categorías MINI (6–9) y KIDS (10–15).' },
  'Lasertag outdoor em cenários imersivos, com monitorização em todos os jogos.':
    { en: 'Outdoor lasertag in immersive scenarios, supervised in every game.', fr: 'Lasertag outdoor dans des décors immersifs, encadré à chaque jeu.', es: 'Láser tag al aire libre en escenarios inmersivos, con supervisión en cada juego.' },
  'Bolas de gel de baixo impacto, ideais para os mais novos. Duração 1h00–1h30.':
    { en: 'Low-impact gel balls, ideal for the youngest. Duration 1h00–1h30.', fr: 'Billes de gel à faible impact, idéales pour les plus jeunes. Durée 1h00–1h30.', es: 'Bolas de gel de bajo impacto, ideales para los más pequeños. Duración 1h00–1h30.' },

  // ── Pack names ──
  'Pack Paintball 100': { en: 'Paintball Pack 100', fr: 'Pack Paintball 100', es: 'Pack Paintball 100' },
  'Pack Paintball 300': { en: 'Paintball Pack 300', fr: 'Pack Paintball 300', es: 'Pack Paintball 300' },
  'Pack Paintball 500': { en: 'Paintball Pack 500', fr: 'Pack Paintball 500', es: 'Pack Paintball 500' },
  'Ultra Paintball': { en: 'Ultra Paintball', fr: 'Ultra Paintball', es: 'Ultra Paintball' },
  'Paintball Stag Party': { en: 'Paintball Stag Party', fr: 'Paintball Stag Party', es: 'Paintball Stag Party' },
  'Extreme Paintball': { en: 'Extreme Paintball', fr: 'Extreme Paintball', es: 'Extreme Paintball' },
  'Pack Base': { en: 'Base Pack', fr: 'Pack Base', es: 'Pack Base' },
  'Pack Aniversário': { en: 'Birthday Pack', fr: 'Pack Anniversaire', es: 'Pack Cumpleaños' },
  'Pack Stag Party': { en: 'Stag Party Pack', fr: 'Pack Stag Party', es: 'Pack Stag Party' },
  'Pack Base Bubble Football': { en: 'Bubble Football Base Pack', fr: 'Pack Base Bubble Football', es: 'Pack Base Bubble Football' },
  'Pack Aniversário 150': { en: 'Birthday Pack 150', fr: 'Pack Anniversaire 150', es: 'Pack Cumpleaños 150' },
  'Pack Especial Aniversário 300': { en: 'Special Birthday Pack 300', fr: 'Pack Anniversaire Spécial 300', es: 'Pack Especial Cumpleaños 300' },
  'Pack Lasertag': { en: 'Lasertag Pack', fr: 'Pack Lasertag', es: 'Pack Láser Tag' },
  'Pack Lasertag Aniversário': { en: 'Lasertag Birthday Pack', fr: 'Pack Lasertag Anniversaire', es: 'Pack Láser Tag Cumpleaños' },
  'Pack Base Gelblast': { en: 'Gelblast Base Pack', fr: 'Pack Base Gelblast', es: 'Pack Base Gelblast' },

  // ── Pack items ──
  '100 bolas': { en: '100 balls', fr: '100 billes', es: '100 bolas' },
  '150 bolas': { en: '150 balls', fr: '150 billes', es: '150 bolas' },
  '300 bolas': { en: '300 balls', fr: '300 billes', es: '300 bolas' },
  '500 bolas': { en: '500 balls', fr: '500 billes', es: '500 bolas' },
  '800 bolas': { en: '800 balls', fr: '800 billes', es: '800 bolas' },
  'Máscara Térmica': { en: 'Thermal mask', fr: 'Masque thermique', es: 'Máscara térmica' },
  'Máscara com lente térmica': { en: 'Mask with thermal lens', fr: 'Masque à verre thermique', es: 'Máscara con lente térmica' },
  'Colete de Proteção': { en: 'Protective vest', fr: 'Gilet de protection', es: 'Chaleco de protección' },
  'Marcador Cal 68': { en: 'Cal 68 marker', fr: 'Marqueur Cal 68', es: 'Marcador Cal 68' },
  'Marcador Cal 50': { en: 'Cal 50 marker', fr: 'Marqueur Cal 50', es: 'Marcador Cal 50' },
  'Marcador Falcon F1': { en: 'Falcon F1 marker', fr: 'Marqueur Falcon F1', es: 'Marcador Falcon F1' },
  'Fato Macaco': { en: 'Coverall', fr: 'Combinaison', es: 'Mono' },
  'Fato Completo': { en: 'Full suit', fr: 'Tenue complète', es: 'Traje completo' },
  'Fato Fantasia': { en: 'Costume', fr: 'Déguisement', es: 'Disfraz' },
  'Luvas': { en: 'Gloves', fr: 'Gants', es: 'Guantes' },
  'Battle Pack': { en: 'Battle Pack', fr: 'Battle Pack', es: 'Battle Pack' },
  'Potes de Bolas': { en: 'Ball pods', fr: 'Pots de billes', es: 'Botes de bolas' },
  'Lançador de Gelblast (oferta)': { en: 'Gelblast launcher (free)', fr: 'Lanceur Gelblast (offert)', es: 'Lanzador Gelblast (regalo)' },
  'Tempo: 1h30': { en: 'Time: 1h30', fr: 'Durée : 1h30', es: 'Tiempo: 1h30' },
  'Tempo: 2h00': { en: 'Time: 2h00', fr: 'Durée : 2h00', es: 'Tiempo: 2h00' },
  'Headset': { en: 'Headset', fr: 'Casque', es: 'Auriculares' },
  'Touca Higiénica': { en: 'Hygienic cap', fr: 'Charlotte hygiénique', es: 'Gorro higiénico' },
  'Shock Band': { en: 'Shock Band', fr: 'Shock Band', es: 'Shock Band' },
  'Bumper Ball 1,50m': { en: 'Bumper Ball 1.50m', fr: 'Bumper Ball 1,50m', es: 'Bumper Ball 1,50m' },
  'Campo de Futebol 5 x 5': { en: '5-a-side football pitch', fr: 'Terrain de foot 5x5', es: 'Campo de fútbol 5x5' },
  'Balizas e bola de futebol': { en: 'Goals and football', fr: 'Buts et ballon', es: 'Porterías y balón' },
  'Jogos: Football, Bowling, Sumo, King': { en: 'Games: Football, Bowling, Sumo, King', fr: 'Jeux : Football, Bowling, Sumo, King', es: 'Juegos: Football, Bowling, Sumo, King' },
  '1500 bolas de gel por criança': { en: '1500 gel balls per child', fr: '1500 billes de gel par enfant', es: '1500 bolas de gel por niño' },
  'Lançador Gelblast': { en: 'Gelblast launcher', fr: 'Lanceur Gelblast', es: 'Lanzador Gelblast' },

  // ── "Every pack includes" ──
  'Briefing personalizado': { en: 'Personalised briefing', fr: 'Briefing personnalisé', es: 'Briefing personalizado' },
  'Monitorização e acompanhamento de todos os jogos': { en: 'Supervision throughout every game', fr: 'Encadrement et suivi de tous les jeux', es: 'Supervisión y acompañamiento en todos los juegos' },
  'Seguro de responsabilidade civil e de acidentes pessoais': { en: 'Public liability and personal accident insurance', fr: 'Assurance responsabilité civile et accidents', es: 'Seguro de responsabilidad civil y accidentes' },
  'Acesso a todos os cenários de jogo': { en: 'Access to all game scenarios', fr: 'Accès à tous les décors de jeu', es: 'Acceso a todos los escenarios de juego' },
  'Acesso a todos os cenários de jogo outdoor': { en: 'Access to all outdoor scenarios', fr: 'Accès à tous les décors outdoor', es: 'Acceso a todos los escenarios outdoor' },
  'Zona de Lanches (30 min) após a atividade': { en: 'Snack area (30 min) after the activity', fr: 'Espace goûter (30 min) après l’activité', es: 'Zona de meriendas (30 min) tras la actividad' },

  // ── Page notes ──
  'Mínimo 10 jogadores. Consumos opcionais (fato, luvas, bolas extra) e mais detalhes na reserva.':
    { en: 'Minimum 10 players. Optional extras (suit, gloves, extra balls) and more details on booking.', fr: 'Minimum 10 joueurs. Options (combinaison, gants, billes) et détails lors de la réservation.', es: 'Mínimo 10 jugadores. Extras opcionales (mono, guantes, bolas) y más detalles en la reserva.' },
  'Mínimo 10 jogadores. Inclui zona de lanches (30 min) após a atividade. Serviço de lanches e consumos opcionais disponíveis na reserva.':
    { en: 'Minimum 10 players. Includes snack area (30 min) after the activity. Catering and optional extras available on booking.', fr: 'Minimum 10 joueurs. Espace goûter (30 min) après l’activité. Restauration et options lors de la réservation.', es: 'Mínimo 10 jugadores. Incluye zona de meriendas (30 min) tras la actividad. Catering y extras disponibles en la reserva.' },

  // ── Empresas ──
  'Seja no campo de Monsanto ou Porto, por umas horas, uma manhã ou um dia, a sua empresa vai encontrar em qualquer Parque Emboscada espaços rodeados de natureza. De uma forma descontraída e divertida, proporcionamos momentos repletos de adrenalina e uma quebra total com a rotina do dia-a-dia.':
    { en: 'Whether at the Monsanto or Porto park, for a few hours, a morning or a full day, your company will find spaces surrounded by nature at any Emboscada Park. In a relaxed and fun way, we provide moments full of adrenaline and a complete break from the daily routine.', fr: 'Que ce soit au parc de Monsanto ou de Porto, pour quelques heures, une matinée ou une journée, votre entreprise trouvera dans chaque Parc Emboscada des espaces entourés de nature. De façon détendue et amusante, nous offrons des moments pleins d’adrénaline et une vraie coupure avec la routine.', es: 'Ya sea en el parque de Monsanto o de Oporto, por unas horas, una mañana o un día, tu empresa encontrará en cualquier Parque Emboscada espacios rodeados de naturaleza. De forma distendida y divertida, ofrecemos momentos llenos de adrenalina y una ruptura total con la rutina.' },
  'Tudo começa com «Era uma vez»… Quer pôr à prova diversas competências que levará consigo para fora do campo e para o local de trabalho? Seja a defender a sua aldeia de um ataque de índios ou a resgatar o CEO da sua organização de uma emboscada numa fábrica abandonada. Eis algumas das competências que cada um poderá evidenciar e/ou reforçar:':
    { en: 'It all starts with “Once upon a time”… Want to test skills you’ll take back to the workplace? Whether defending your village from an attack or rescuing your CEO from an ambush in an abandoned factory. Here are some of the skills each person can show and/or strengthen:', fr: 'Tout commence par « Il était une fois »… Envie de mettre à l’épreuve des compétences que vous ramènerez au travail ? Défendre son village ou sauver son PDG d’une embuscade dans une usine abandonnée. Voici quelques compétences à révéler et/ou renforcer :', es: 'Todo empieza con «Érase una vez»… ¿Quieres poner a prueba competencias que te llevarás al trabajo? Ya sea defendiendo tu aldea o rescatando al CEO de una emboscada en una fábrica abandonada. Estas son algunas competencias que cada uno puede demostrar y/o reforzar:' },
  'Trabalho em equipa': { en: 'Teamwork', fr: 'Travail d’équipe', es: 'Trabajo en equipo' },
  'Espírito de camaradagem e confiança entre colegas': { en: 'Camaraderie and trust between colleagues', fr: 'Esprit de camaraderie et confiance', es: 'Compañerismo y confianza entre colegas' },
  'Qualidade de liderança': { en: 'Leadership quality', fr: 'Qualités de leadership', es: 'Capacidad de liderazgo' },
  'Reforço de auto-confiança': { en: 'Boosted self-confidence', fr: 'Renforcement de la confiance en soi', es: 'Refuerzo de la autoconfianza' },
  'Melhorias no processo de tomada de decisão': { en: 'Better decision-making', fr: 'Amélioration de la prise de décision', es: 'Mejora en la toma de decisiones' },
  'Tudo o resto é pura diversão!': { en: 'Everything else is pure fun!', fr: 'Le reste, c’est du pur plaisir !', es: '¡Todo lo demás es pura diversión!' },
  'Slide e Escalada': { en: 'Zipline & Climbing', fr: 'Tyrolienne & Escalade', es: 'Tirolina y Escalada' },
  'Festas': { en: 'Parties', fr: 'Fêtes', es: 'Fiestas' },
  'Team Building': { en: 'Team Building', fr: 'Team Building', es: 'Team Building' },
  'Desde 2001 que trabalhamos em conjunto com os nossos clientes para construir experiências memoráveis, à medida de cada evento ou team building.':
    { en: 'Since 2001 we’ve worked with our clients to build memorable experiences, tailored to each event or team building.', fr: 'Depuis 2001, nous construisons avec nos clients des expériences mémorables, sur mesure pour chaque événement ou team building.', es: 'Desde 2001 trabajamos con nuestros clientes para crear experiencias memorables, a medida de cada evento o team building.' },
  'Encontra disponível todo o equipamento necessário (máscara, fato, marcador, luvas, colete, monitor, seguro, ar ilimitado) para todos os jogadores, e em todos os jogos são acompanhados por monitores experientes.':
    { en: 'All the equipment you need (mask, suit, marker, gloves, vest, monitor, insurance, unlimited air) is available for every player, and every game is led by experienced monitors.', fr: 'Tout l’équipement nécessaire (masque, combinaison, marqueur, gants, gilet, moniteur, assurance, air illimité) est disponible, et chaque jeu est encadré par des moniteurs expérimentés.', es: 'Todo el equipo necesario (máscara, mono, marcador, guantes, chaleco, monitor, seguro, aire ilimitado) está disponible, y cada juego es dirigido por monitores experimentados.' },
  'Os Parques Emboscada variam em capacidade, podendo acomodar de 20 a 150 ou 300 pessoas (dependendo da localização). Contamos ainda com o apoio de vários parceiros externos, de modo a adequar a oferta aos vários momentos do dia — sendo possível acrescentar actividades adicionais ou refeições para todos os gostos.':
    { en: 'The Emboscada Parks vary in capacity, hosting from 20 to 150 or 300 people (depending on location). We also work with external partners to tailor the offer to each moment of the day — adding extra activities or meals for every taste.', fr: 'Les Parcs Emboscada varient en capacité, de 20 à 150 ou 300 personnes (selon le site). Nous travaillons aussi avec des partenaires externes pour adapter l’offre à chaque moment — activités ou repas supplémentaires pour tous les goûts.', es: 'Los Parques Emboscada varían en capacidad, de 20 a 150 o 300 personas (según la ubicación). Contamos con socios externos para adaptar la oferta a cada momento — con actividades o comidas para todos los gustos.' },

  // ── Contactos / Campos ──
  'Horários — Verão:': { en: 'Hours — Summer:', fr: 'Horaires — Été :', es: 'Horarios — Verano:' },
  'Inverno:': { en: 'Winter:', fr: 'Hiver :', es: 'Invierno:' },

  // ── FAQ ──

  // ── Location pages (Porto / Monsanto) ──
  'Localização': { en: 'Location', fr: 'Emplacement', es: 'Ubicación' },
  'Como chegar': { en: 'How to get here', fr: 'Comment venir', es: 'Cómo llegar' },
  'Ver no Google Maps': { en: 'View on Google Maps', fr: 'Voir sur Google Maps', es: 'Ver en Google Maps' },
  'Ver galeria': { en: 'View gallery', fr: 'Voir la galerie', es: 'Ver galería' },
  'Galeria': { en: 'Gallery', fr: 'Galerie', es: 'Galería' },
  'Cenários': { en: 'Scenarios', fr: 'Décors', es: 'Escenarios' },
  'Ataque': { en: 'Attack', fr: 'Attaque', es: 'Ataque' },
  'Defesa': { en: 'Defence', fr: 'Défense', es: 'Defensa' },
  'Estratégia': { en: 'Strategy', fr: 'Stratégie', es: 'Estrategia' },
  'Artilharia': { en: 'Firepower', fr: 'Artillerie', es: 'Artillería' },
  'A cerca de 20 minutos do Porto, em Canedo (Vila Nova de Gaia). Estacionamento gratuito no local.':
    { en: 'About 20 minutes from Porto, in Canedo (Vila Nova de Gaia). Free on-site parking.', fr: 'À environ 20 minutes de Porto, à Canedo (Vila Nova de Gaia). Parking gratuit sur place.', es: 'A unos 20 minutos de Oporto, en Canedo (Vila Nova de Gaia). Aparcamiento gratuito en el lugar.' },
  'CARRIS — Autocarro 750: a 60 metros (1 min a pé).':
    { en: 'CARRIS — Bus 750: 60 metres away (1 min walk).', fr: 'CARRIS — Bus 750 : à 60 mètres (1 min à pied).', es: 'CARRIS — Autobús 750: a 60 metros (1 min a pie).' },
  'CARRIS — Autocarros 714 e 750: a 406 metros (1 min a pé).':
    { en: 'CARRIS — Buses 714 and 750: 406 metres away (1 min walk).', fr: 'CARRIS — Bus 714 et 750 : à 406 mètres (1 min à pied).', es: 'CARRIS — Autobuses 714 y 750: a 406 metros (1 min a pie).' },
  'Situado em Canedo a 20 minutos do Porto, o nosso campo tem uma envolvência absolutamente natural, possibilitando uma «fuga» ao quotidiano. Com uma zona coberta para 200 pessoas, este espaço funde-se com o meio envolvente, fomentando o convívio, o descanso e a diversão.':
    { en: 'Located in Canedo, 20 minutes from Porto, our field is surrounded by pure nature — a real escape from the everyday. With a covered area for 200 people, the space blends into its surroundings, encouraging socialising, relaxation and fun.', fr: 'Situé à Canedo, à 20 minutes de Porto, notre terrain est entouré d’une nature totale — une véritable évasion du quotidien. Avec une zone couverte pour 200 personnes, l’espace se fond dans son environnement, favorisant convivialité, détente et amusement.', es: 'Situado en Canedo, a 20 minutos de Oporto, nuestro campo está rodeado de naturaleza — una auténtica escapada de la rutina. Con una zona cubierta para 200 personas, el espacio se funde con el entorno, fomentando la convivencia, el descanso y la diversión.' },
  'Situado no Parque de Campismo de Monsanto a 10 minutos do centro da cidade de Lisboa, o Parque Emboscada transmite adrenalina e emoção a quem o visita.':
    { en: 'Located in the Monsanto campsite, 10 minutes from Lisbon city centre, Parque Emboscada delivers adrenaline and excitement to every visitor.', fr: 'Situé dans le camping de Monsanto, à 10 minutes du centre de Lisbonne, le Parque Emboscada offre adrénaline et émotion à ses visiteurs.', es: 'Situado en el camping de Monsanto, a 10 minutos del centro de Lisboa, el Parque Emboscada transmite adrenalina y emoción a quien lo visita.' },
  'Entre no ritmo citadino e teste a sua pontaria num confronto entre índios e cowboys no Western, ou explore os caminhos abandonados no nosso campo Factory. Atenção: quando visitar a Toxic City tenha cuidado com a exposição aos gases tóxicos que pairam no ar. Todos os cenários são criados para todos e ao gosto de todos.':
    { en: 'Get into the city rhythm and test your aim in a cowboys-vs-indians showdown at the Western, or explore the abandoned paths of our Factory field. Careful in Toxic City — watch out for the toxic gases in the air. Every scenario is designed for everyone.', fr: 'Entrez dans le rythme urbain et testez votre visée dans un duel cowboys contre indiens au Western, ou explorez les chemins abandonnés de notre terrain Factory. Attention à Toxic City : méfiez-vous des gaz toxiques dans l’air. Tous les décors sont pensés pour tous.', es: 'Métete en el ritmo urbano y pon a prueba tu puntería en un duelo de indios y vaqueros en el Western, o explora los caminos abandonados de nuestro campo Factory. Cuidado en Toxic City con los gases tóxicos del aire. Todos los escenarios están pensados para todos.' },
  'Para os mais corajosos, junte o grupo, teste os seus limites e jogue paintball nocturno! Se procura uma experiência única de diversão, o Parque Emboscada é a opção.':
    { en: 'For the brave, gather your group, push your limits and play night paintball! If you’re after a unique fun experience, Parque Emboscada is the place.', fr: 'Pour les plus courageux, réunissez le groupe, repoussez vos limites et jouez au paintball nocturne ! Pour une expérience unique, le Parque Emboscada est le bon choix.', es: 'Para los más valientes, reúne al grupo, pon a prueba tus límites y juega paintball nocturno. Si buscas una experiencia única de diversión, el Parque Emboscada es la opción.' },

  // ── Reservation form ──
  'Nome': { en: 'Name', fr: 'Nom', es: 'Nombre' },
  'Nome do Organizador': { en: 'Organiser name', fr: 'Nom de l’organisateur', es: 'Nombre del organizador' },
  'Nº de jogadores': { en: 'Number of players', fr: 'Nombre de joueurs', es: 'Nº de jugadores' },
  'Período preferencial': { en: 'Preferred time', fr: 'Créneau préféré', es: 'Franja preferida' },
  'Manhã': { en: 'Morning', fr: 'Matin', es: 'Mañana' },
  'Tarde': { en: 'Afternoon', fr: 'Après-midi', es: 'Tarde' },
  'Dia Completo': { en: 'Full day', fr: 'Journée complète', es: 'Día completo' },
  'Observações': { en: 'Notes', fr: 'Remarques', es: 'Observaciones' },
  'Pedido de orçamento enviado! Entramos em contacto brevemente.': { en: 'Quote request sent! We’ll be in touch shortly.', fr: 'Demande de devis envoyée ! Nous vous contacterons bientôt.', es: '¡Solicitud de presupuesto enviada! Te contactaremos pronto.' },
  'Telefone': { en: 'Phone', fr: 'Téléphone', es: 'Teléfono' },
  'Outro código': { en: 'Other code', fr: 'Autre indicatif', es: 'Otro código' },
  'Email': { en: 'Email', fr: 'E-mail', es: 'Correo' },
  'Introduz um email válido (com @).': { en: 'Enter a valid email (with @).', fr: 'Saisis un e-mail valide (avec @).', es: 'Introduce un correo válido (con @).' },
  'Data pretendida': { en: 'Preferred date', fr: 'Date souhaitée', es: 'Fecha deseada' },
  'Parque': { en: 'Park', fr: 'Parc', es: 'Parque' },
  'Actividade': { en: 'Activity', fr: 'Activité', es: 'Actividad' },
  'Mensagem': { en: 'Message', fr: 'Message', es: 'Mensaje' },
  'Selecionar…': { en: 'Select…', fr: 'Choisir…', es: 'Seleccionar…' },
  'Pack': { en: 'Pack', fr: 'Pack', es: 'Pack' },
  'Escolhe primeiro a actividade': { en: 'Choose an activity first', fr: 'Choisis d’abord l’activité', es: 'Elige primero la actividad' },
  'Conta-nos o que procuras…': { en: 'Tell us what you’re looking for…', fr: 'Dites-nous ce que vous cherchez…', es: 'Cuéntanos qué buscas…' },
  'Enviar pedido': { en: 'Send request', fr: 'Envoyer la demande', es: 'Enviar solicitud' },
  'A enviar…': { en: 'Sending…', fr: 'Envoi…', es: 'Enviando…' },
  'Pedido enviado! Entramos em contacto para confirmar a tua reserva.':
    { en: 'Request sent! We’ll be in touch to confirm your booking.', fr: 'Demande envoyée ! Nous vous contacterons pour confirmer.', es: '¡Solicitud enviada! Te contactaremos para confirmar.' },
  'Fazer outro pedido': { en: 'Make another request', fr: 'Faire une autre demande', es: 'Hacer otra solicitud' },

  // ── Privacy policy ──
  'O Parque Emboscada, entidade pertencente à Emboscada – Organização de Eventos, Lda., preocupa-se em proteger a sua privacidade e irá processar e armazenar os seus dados pessoais, enquanto responsável pelo tratamento dos mesmos.':
    { en: 'Parque Emboscada, part of Emboscada – Organização de Eventos, Lda., is committed to protecting your privacy and will process and store your personal data as the data controller.', fr: 'Parque Emboscada, entité appartenant à Emboscada – Organização de Eventos, Lda., s’engage à protéger votre vie privée et traitera et conservera vos données personnelles en tant que responsable du traitement.', es: 'Parque Emboscada, entidad perteneciente a Emboscada – Organização de Eventos, Lda., se compromete a proteger su privacidad y tratará y almacenará sus datos personales como responsable del tratamiento.' },
  'Os dados pessoais recolhidos serão conservados até retirada do seu consentimento. No processo de adesão, os clientes expressam o seu consentimento quanto às finalidades de tratamento dos seus dados.':
    { en: 'The personal data collected will be kept until you withdraw your consent. When signing up, customers give their consent regarding the purposes for which their data is processed.', fr: 'Les données personnelles collectées seront conservées jusqu’au retrait de votre consentement. Lors de l’inscription, les clients donnent leur consentement quant aux finalités du traitement de leurs données.', es: 'Los datos personales recogidos se conservarán hasta la retirada de su consentimiento. Al registrarse, los clientes expresan su consentimiento sobre las finalidades del tratamiento de sus datos.' },
  'A aceitação do tratamento de dados é prestada à Emboscada – Organização de Eventos, Lda.':
    { en: 'Consent to data processing is given to Emboscada – Organização de Eventos, Lda.', fr: 'L’acceptation du traitement des données est donnée à Emboscada – Organização de Eventos, Lda.', es: 'La aceptación del tratamiento de datos se otorga a Emboscada – Organização de Eventos, Lda.' },
  'A aceitação dos termos de uso e de proteção de dados pessoais é obrigatória, sendo opcional a possibilidade de receber comunicações, a aceitação de análises de perfil e de localização.':
    { en: 'Accepting the terms of use and personal data protection is mandatory; receiving communications and accepting profiling and location analysis are optional.', fr: 'L’acceptation des conditions d’utilisation et de protection des données est obligatoire ; la réception de communications et l’acceptation de l’analyse de profil et de localisation sont facultatives.', es: 'La aceptación de los términos de uso y de protección de datos es obligatoria; recibir comunicaciones y aceptar el análisis de perfil y de localización es opcional.' },
  'A não aceitação de comunicações e análises de perfil impossibilita o acesso a campanhas ajustadas ao seu perfil de consumo.':
    { en: 'Declining communications and profiling means you will not have access to campaigns tailored to your consumer profile.', fr: 'Le refus des communications et de l’analyse de profil empêche l’accès aux campagnes adaptées à votre profil de consommation.', es: 'No aceptar comunicaciones ni análisis de perfil impide el acceso a campañas ajustadas a su perfil de consumo.' },
  'É-lhe garantido o acesso, retificação, alteração, limitação do tratamento, portabilidade ou a eliminação dos seus dados pessoais, podendo tais direitos ser exercidos no site www.emboscadapaintball.com.':
    { en: 'You are guaranteed the right to access, rectify, change, restrict the processing of, port or delete your personal data, and these rights may be exercised at www.emboscadapaintball.com.', fr: 'L’accès, la rectification, la modification, la limitation du traitement, la portabilité ou la suppression de vos données personnelles vous sont garantis, ces droits pouvant être exercés sur le site www.emboscadapaintball.com.', es: 'Se le garantiza el acceso, la rectificación, la modificación, la limitación del tratamiento, la portabilidad o la eliminación de sus datos personales, derechos que pueden ejercerse en el sitio www.emboscadapaintball.com.' },
  'A eliminação dos seus dados implica o cancelamento do consentimento para receber informações sobre a Emboscada – Organização de Eventos, Lda.':
    { en: 'Deleting your data means cancelling your consent to receive information about Emboscada – Organização de Eventos, Lda.', fr: 'La suppression de vos données entraîne l’annulation du consentement à recevoir des informations sur Emboscada – Organização de Eventos, Lda.', es: 'La eliminación de sus datos implica la cancelación del consentimiento para recibir información sobre Emboscada – Organização de Eventos, Lda.' },
  'Terá sempre o direito a apresentar uma reclamação à CNPD ou a outra autoridade de controlo competente nos termos da lei, caso entenda que o tratamento dos seus dados pela Emboscada – Organização de Eventos Lda. viola o regime legal em vigor a cada momento.':
    { en: 'You will always have the right to lodge a complaint with the CNPD or another competent supervisory authority under the law, if you believe that the processing of your data by Emboscada – Organização de Eventos Lda. breaches the legislation in force at any given time.', fr: 'Vous aurez toujours le droit de déposer une réclamation auprès de la CNPD ou d’une autre autorité de contrôle compétente conformément à la loi, si vous estimez que le traitement de vos données par Emboscada – Organização de Eventos Lda. enfreint la législation en vigueur.', es: 'Siempre tendrá derecho a presentar una reclamación ante la CNPD u otra autoridad de control competente conforme a la ley, si considera que el tratamiento de sus datos por Emboscada – Organização de Eventos Lda. infringe el régimen legal vigente en cada momento.' },
  'Não são aceites registos de menores de idade.':
    { en: 'Registrations by minors are not accepted.', fr: 'Les inscriptions de mineurs ne sont pas acceptées.', es: 'No se aceptan registros de menores de edad.' },
  'No compromisso de assegurar a segurança dos dados pessoais dos seus clientes, as Companhias implementaram as medidas de segurança técnica e organizacionais consideradas necessárias às atividades de recolha e processamento.':
    { en: 'Committed to ensuring the security of their customers’ personal data, the Companies have implemented the technical and organisational security measures deemed necessary for collection and processing activities.', fr: 'Dans leur engagement à garantir la sécurité des données personnelles de leurs clients, les Sociétés ont mis en place les mesures de sécurité techniques et organisationnelles jugées nécessaires aux activités de collecte et de traitement.', es: 'En su compromiso de garantizar la seguridad de los datos personales de sus clientes, las Compañías han implementado las medidas de seguridad técnicas y organizativas consideradas necesarias para las actividades de recogida y tratamiento.' },
  'Os dados recolhidos não são transferidos para terceiros sem o seu consentimento prévio.':
    { en: 'The data collected is not transferred to third parties without your prior consent.', fr: 'Les données collectées ne sont pas transférées à des tiers sans votre consentement préalable.', es: 'Los datos recogidos no se transfieren a terceros sin su consentimiento previo.' },
  'Os dados pessoais poderão ainda ser partilhados com outras entidades de acordo com: a) legislação aplicável; b) cumprimento de obrigações legais; c) ou na resposta a pedidos de autoridades públicas e governamentais.':
    { en: 'Personal data may also be shared with other entities in accordance with: a) applicable legislation; b) compliance with legal obligations; c) or in response to requests from public and governmental authorities.', fr: 'Les données personnelles peuvent également être partagées avec d’autres entités conformément à : a) la législation applicable ; b) le respect d’obligations légales ; c) ou en réponse à des demandes d’autorités publiques et gouvernementales.', es: 'Los datos personales también podrán compartirse con otras entidades de acuerdo con: a) la legislación aplicable; b) el cumplimiento de obligaciones legales; c) o en respuesta a solicitudes de autoridades públicas y gubernamentales.' },
  'A Política de proteção de dados pessoais pode ser alterada em qualquer momento, com respeito pela legislação aplicável. As alterações serão comunicadas no site, entrando em vigor 10 dias úteis contados após a sua publicação no site.':
    { en: 'The personal data protection policy may be changed at any time, in compliance with applicable legislation. Changes will be announced on the website and take effect 10 working days after being published there.', fr: 'La politique de protection des données personnelles peut être modifiée à tout moment, dans le respect de la législation applicable. Les modifications seront communiquées sur le site et entreront en vigueur 10 jours ouvrables après leur publication.', es: 'La política de protección de datos personales puede modificarse en cualquier momento, respetando la legislación aplicable. Los cambios se comunicarán en el sitio web y entrarán en vigor 10 días hábiles después de su publicación.' },

  // ── FAQ ──
  'Quais são as regras de um jogo de Paintball?': { en: 'What are the rules of a paintball game?', fr: 'Quelles sont les règles d’une partie de paintball ?', es: '¿Cuáles son las reglas de una partida de paintball?' },
  'Antes de começar a jogar, todos os jogadores recebem um briefing explicativo por parte do Monitor responsável pela sessão.':
    { en: 'Before playing, all players receive an explanatory briefing from the Monitor in charge of the session.', fr: 'Avant de jouer, tous les joueurs reçoivent un briefing explicatif du moniteur responsable de la session.', es: 'Antes de empezar a jugar, todos los jugadores reciben un briefing explicativo del monitor responsable de la sesión.' },
  'Existe algum sítio para deixar os pertences?': { en: 'Is there somewhere to leave belongings?', fr: 'Y a-t-il un endroit pour laisser ses affaires ?', es: '¿Hay algún sitio para dejar las pertenencias?' },
  'Não temos cacifos disponíveis, pelo que o ideal é guardar tudo no carro sem estar à vista. Não nos responsabilizamos por pertences deixados ao acaso no Parque.':
    { en: 'We don’t have lockers, so it’s best to keep everything out of sight in your car. We are not responsible for belongings left unattended in the Park.', fr: 'Nous n’avons pas de casiers ; l’idéal est de tout garder hors de vue dans votre voiture. Nous ne sommes pas responsables des affaires laissées sans surveillance dans le parc.', es: 'No disponemos de taquillas, por lo que lo ideal es guardar todo en el coche fuera de la vista. No nos responsabilizamos de las pertenencias dejadas al azar en el Parque.' },
  'O que devo vestir?': { en: 'What should I wear?', fr: 'Que dois-je porter ?', es: '¿Qué debo llevar puesto?' },
  'Recomendamos calçado e roupa confortável, de preferência lavável. Pode sempre alugar um fato-macaco — informe-se junto do seu Monitor.':
    { en: 'We recommend comfortable, preferably washable clothing and footwear. You can always rent a coverall — ask your Monitor.', fr: 'Nous recommandons des chaussures et des vêtements confortables, de préférence lavables. Vous pouvez toujours louer une combinaison — renseignez-vous auprès de votre moniteur.', es: 'Recomendamos calzado y ropa cómoda, preferiblemente lavable. Siempre puede alquilar un mono — infórmese con su monitor.' },
  'A tinta das bolas estraga a roupa?': { en: 'Does the paint from the balls ruin clothing?', fr: 'La peinture des billes abîme-t-elle les vêtements ?', es: '¿La pintura de las bolas estropea la ropa?' },
  'As nossas bolas são biodegradáveis, maioritariamente compostas por amido de milho, óleos de peixe e corante. Nada na sua composição deixa nódoas ou marcas permanentes nos tecidos.':
    { en: 'Our balls are biodegradable, mostly made of corn starch, fish oils and dye. Nothing in their composition leaves permanent stains or marks on fabrics.', fr: 'Nos billes sont biodégradables, principalement composées d’amidon de maïs, d’huiles de poisson et de colorant. Rien dans leur composition ne laisse de taches ou de marques permanentes sur les tissus.', es: 'Nuestras bolas son biodegradables, compuestas mayoritariamente de almidón de maíz, aceites de pescado y colorante. Nada en su composición deja manchas ni marcas permanentes en los tejidos.' },
  'Qual a idade mínima para jogar Paintball?': { en: 'What is the minimum age to play paintball?', fr: 'Quel est l’âge minimum pour jouer au paintball ?', es: '¿Cuál es la edad mínima para jugar paintball?' },
  'A idade mínima aconselhada são os 6 anos de idade no caso do pack MINI, e 9/10 anos no caso do pack KIDS.':
    { en: 'The recommended minimum age is 6 for the MINI pack and 9/10 for the KIDS pack.', fr: 'L’âge minimum conseillé est de 6 ans pour le pack MINI et de 9/10 ans pour le pack KIDS.', es: 'La edad mínima aconsejada es de 6 años para el pack MINI y de 9/10 años para el pack KIDS.' },
  'Preciso pagar alguma coisa extra no dia?': { en: 'Do I need to pay anything extra on the day?', fr: 'Dois-je payer un supplément le jour même ?', es: '¿Tengo que pagar algo extra el mismo día?' },
  'Os preços dos packs incluem todo o material base de segurança necessário para a atividade. Apenas paga extras caso consuma — água, carregamentos de bolas adicionais, fatos e/ou luvas, etc.':
    { en: 'Pack prices include all the basic safety equipment needed for the activity. You only pay extra for what you use — water, additional ball refills, coveralls and/or gloves, etc.', fr: 'Les prix des packs incluent tout le matériel de sécurité de base nécessaire à l’activité. Vous ne payez un supplément que pour ce que vous consommez — eau, recharges de billes, combinaisons et/ou gants, etc.', es: 'Los precios de los packs incluyen todo el material básico de seguridad necesario para la actividad. Solo paga extras si consume — agua, recargas de bolas adicionales, monos y/o guantes, etc.' },
  'Posso levar o meu próprio equipamento?': { en: 'Can I bring my own equipment?', fr: 'Puis-je apporter mon propre équipement ?', es: '¿Puedo llevar mi propio equipo?' },
  'Clientes da Loja Emboscada com material próprio poderão levar o seu material mediante pedido prévio.':
    { en: 'Emboscada Store customers with their own gear may bring it upon prior request.', fr: 'Les clients de la Boutique Emboscada disposant de leur propre matériel peuvent l’apporter sur demande préalable.', es: 'Los clientes de la Tienda Emboscada con material propio podrán llevarlo mediante solicitud previa.' },
  'Temos de escolher todos o mesmo Pack?': { en: 'Do we all have to choose the same pack?', fr: 'Devons-nous tous choisir le même pack ?', es: '¿Tenemos que elegir todos el mismo pack?' },
  'Não é obrigatório, mas recomendamos que todos os jogadores partam com o mesmo número de bolas, para evitar que uns fiquem sem bolas antes dos outros. É sempre possível comprar bolas adicionais no final.':
    { en: 'It’s not mandatory, but we recommend all players start with the same number of balls, to avoid some running out before others. You can always buy additional balls at the end.', fr: 'Ce n’est pas obligatoire, mais nous recommandons que tous les joueurs commencent avec le même nombre de billes, pour éviter que certains n’en manquent avant les autres. Il est toujours possible d’acheter des billes supplémentaires à la fin.', es: 'No es obligatorio, pero recomendamos que todos los jugadores empiecen con el mismo número de bolas, para evitar que unos se queden sin bolas antes que otros. Siempre es posible comprar bolas adicionales al final.' },
  'Podemos comprar bolas adicionais depois de acabarem as do Pack escolhido?': { en: 'Can we buy more balls once the pack’s balls run out?', fr: 'Pouvons-nous acheter des billes supplémentaires une fois celles du pack épuisées ?', es: '¿Podemos comprar bolas adicionales cuando se acaben las del pack elegido?' },
  'Sim. No Parque pode adquirir carregamentos de bolas extra junto do Monitor da atividade.':
    { en: 'Yes. At the Park you can buy extra ball refills from the activity Monitor.', fr: 'Oui. Au parc, vous pouvez acheter des recharges de billes auprès du moniteur de l’activité.', es: 'Sí. En el Parque puede adquirir recargas de bolas extra con el monitor de la actividad.' },
  'Posso levar bolas de casa?': { en: 'Can I bring balls from home?', fr: 'Puis-je apporter des billes de chez moi ?', es: '¿Puedo llevar bolas de casa?' },
  'Não. As bolas têm de ser compradas no Parque Emboscada, com a exceção de clientes da Loja Emboscada com material próprio, mediante pedido prévio.':
    { en: 'No. Balls must be bought at Parque Emboscada, except for Emboscada Store customers with their own gear, upon prior request.', fr: 'Non. Les billes doivent être achetées au Parque Emboscada, sauf pour les clients de la Boutique Emboscada disposant de leur propre matériel, sur demande préalable.', es: 'No. Las bolas deben comprarse en el Parque Emboscada, salvo los clientes de la Tienda Emboscada con material propio, mediante solicitud previa.' },
  'Posso levar comida e bebida?': { en: 'Can I bring food and drink?', fr: 'Puis-je apporter à manger et à boire ?', es: '¿Puedo llevar comida y bebida?' },
  'Sim, pode trazer comida e bebida (exceto bebidas alcoólicas) e utilizar a nossa zona coberta ou semicoberta. A utilização deste espaço para lanches em festas de aniversário requer comunicação prévia no ato de reserva e está sujeita à nossa disponibilidade e às regras de utilização do espaço.':
    { en: 'Yes, you can bring food and drink (except alcoholic beverages) and use our covered or semi-covered area. Using this space for snacks at birthday parties requires prior notice when booking and is subject to availability and the space usage rules.', fr: 'Oui, vous pouvez apporter à manger et à boire (sauf boissons alcoolisées) et utiliser notre zone couverte ou semi-couverte. L’utilisation de cet espace pour les goûters d’anniversaire nécessite une communication préalable lors de la réservation et est soumise à disponibilité et aux règles d’utilisation de l’espace.', es: 'Sí, puede traer comida y bebida (excepto bebidas alcohólicas) y utilizar nuestra zona cubierta o semicubierta. El uso de este espacio para meriendas en fiestas de cumpleaños requiere comunicación previa al reservar y está sujeto a disponibilidad y a las normas de uso del espacio.' },
  'Posso encomendar serviço de lanches?': { en: 'Can I order a catering service?', fr: 'Puis-je commander un service de goûter ?', es: '¿Puedo encargar servicio de meriendas?' },
  'No Parque Emboscada Lisboa (Monsanto) é possível contratar serviço de lanches através dos nossos parceiros do Monsanto Villas Restaurante. Deve ser encomendado com um mínimo de 48 horas úteis de antecedência, sendo servido no bar/restaurante do Lisboa Camping & Bungalows.':
    { en: 'At Parque Emboscada Lisboa (Monsanto) you can book a catering service through our partners at Monsanto Villas Restaurante. It must be ordered at least 48 working hours in advance and is served at the Lisboa Camping & Bungalows bar/restaurant.', fr: 'Au Parque Emboscada Lisboa (Monsanto), vous pouvez réserver un service de goûter via nos partenaires du Monsanto Villas Restaurante. Il doit être commandé au moins 48 heures ouvrables à l’avance et est servi au bar/restaurant du Lisboa Camping & Bungalows.', es: 'En el Parque Emboscada Lisboa (Monsanto) es posible contratar servicio de meriendas a través de nuestros socios del Monsanto Villas Restaurante. Debe encargarse con un mínimo de 48 horas hábiles de antelación y se sirve en el bar/restaurante del Lisboa Camping & Bungalows.' },
  'Em que dias o Parque está aberto?': { en: 'Which days is the Park open?', fr: 'Quels jours le parc est-il ouvert ?', es: '¿Qué días está abierto el Parque?' },
  'O Parque está aberto mediante marcação, 365 dias por ano.':
    { en: 'The Park is open by appointment, 365 days a year.', fr: 'Le parc est ouvert sur réservation, 365 jours par an.', es: 'El Parque está abierto mediante reserva, 365 días al año.' },
  'Preciso de pagar alguma coisa para fazer a reserva?': { en: 'Do I need to pay anything to book?', fr: 'Dois-je payer quelque chose pour réserver ?', es: '¿Tengo que pagar algo para reservar?' },
  'Sim. As reservas devem ser feitas com um mínimo de 24 horas úteis de antecedência e carecem de pagamento antecipado: 50,00€ para grupos estimados entre 10 e 14 jogadores (1 Monitor) e 80,00€ para grupos acima de 15 jogadores (2 ou mais monitores). Este valor é posteriormente descontado no valor total da atividade, a liquidar no próprio dia.':
    { en: 'Yes. Bookings must be made at least 24 working hours in advance and require an advance payment: €50.00 for groups estimated at 10–14 players (1 Monitor) and €80.00 for groups over 15 players (2 or more monitors). This amount is later deducted from the total activity price, payable on the day.', fr: 'Oui. Les réservations doivent être faites au moins 24 heures ouvrables à l’avance et nécessitent un paiement anticipé : 50,00 € pour les groupes estimés entre 10 et 14 joueurs (1 moniteur) et 80,00 € pour les groupes de plus de 15 joueurs (2 moniteurs ou plus). Ce montant est ensuite déduit du prix total de l’activité, à régler le jour même.', es: 'Sí. Las reservas deben hacerse con un mínimo de 24 horas hábiles de antelación y requieren un pago anticipado: 50,00€ para grupos estimados entre 10 y 14 jugadores (1 monitor) y 80,00€ para grupos de más de 15 jugadores (2 o más monitores). Este importe se descuenta después del precio total de la actividad, a pagar el mismo día.' },
  'Qual o horário das sessões?': { en: 'What are the session times?', fr: 'Quels sont les horaires des sessions ?', es: '¿Cuál es el horario de las sesiones?' },
  'O Parque pode operar de 2ª a Domingo das 09h00 às 22h00, com ajustes conforme a época. No Inverno as sessões decorrem normalmente entre as 09h00 e as 18h00; na Primavera e Verão podem estender-se até às 22h00. No Inverno começa a escurecer mais cedo, pelo que horários mais tardios têm acesso apenas aos campos 1 e 2 (luz artificial).':
    { en: 'The Park can operate Monday to Sunday from 9:00 to 22:00, with adjustments by season. In winter, sessions usually run between 9:00 and 18:00; in spring and summer they can extend to 22:00. In winter it gets dark earlier, so later slots only have access to fields 1 and 2 (artificial light).', fr: 'Le parc peut fonctionner du lundi au dimanche de 9h00 à 22h00, avec des ajustements selon la saison. En hiver, les sessions se déroulent généralement entre 9h00 et 18h00 ; au printemps et en été, elles peuvent aller jusqu’à 22h00. En hiver, la nuit tombe plus tôt : les créneaux tardifs n’ont accès qu’aux terrains 1 et 2 (lumière artificielle).', es: 'El Parque puede operar de lunes a domingo de 09:00 a 22:00, con ajustes según la época. En invierno las sesiones transcurren normalmente entre las 09:00 y las 18:00; en primavera y verano pueden extenderse hasta las 22:00. En invierno oscurece antes, por lo que los horarios más tardíos solo tienen acceso a los campos 1 y 2 (luz artificial).' },
  'Como posso pagar o sinal?': { en: 'How can I pay the deposit?', fr: 'Comment puis-je payer l’acompte ?', es: '¿Cómo puedo pagar la señal?' },
  'O pagamento do sinal pode ser feito por Transferência Bancária, Referência Multibanco, MBWAY ou PayPal. O restante pagamento é efetuado no parque (Multibanco, MBWAY ou Numerário) e deve ser assegurado pelo organizador, que recolhe o pagamento de todos os jogadores.':
    { en: 'The deposit can be paid by bank transfer, Multibanco reference, MBWAY or PayPal. The remaining payment is made at the park (Multibanco, MBWAY or cash) and must be handled by the organiser, who collects payment from all players.', fr: 'L’acompte peut être payé par virement bancaire, référence Multibanco, MBWAY ou PayPal. Le solde est réglé au parc (Multibanco, MBWAY ou espèces) et doit être assuré par l’organisateur, qui collecte le paiement de tous les joueurs.', es: 'La señal puede pagarse por transferencia bancaria, referencia Multibanco, MBWAY o PayPal. El resto del pago se realiza en el parque (Multibanco, MBWAY o efectivo) y debe asegurarlo el organizador, que recoge el pago de todos los jugadores.' },
  'Quantos jogadores são necessários para marcar um jogo?': { en: 'How many players are needed to book a game?', fr: 'Combien de joueurs faut-il pour réserver une partie ?', es: '¿Cuántos jugadores se necesitan para reservar un juego?' },
  'O número mínimo é de 10 jogadores. Aceitamos grupos com menos participantes, pagando sempre o mínimo de 10 (no Paintball, recebem as bolas dos 10 para dividir pelo número efetivo). Para atividades de maior dimensão, aceitamos até 150 jogadores por grupo.':
    { en: 'The minimum is 10 players. We accept smaller groups, always paying the minimum of 10 (in paintball, you get the balls for 10 to split among the actual number of players). For larger activities, we accept up to 150 players per group.', fr: 'Le minimum est de 10 joueurs. Nous acceptons les groupes plus petits, avec toujours le paiement du minimum de 10 (au paintball, vous recevez les billes de 10 à répartir entre le nombre réel de joueurs). Pour les activités de plus grande envergure, nous acceptons jusqu’à 150 joueurs par groupe.', es: 'El mínimo es de 10 jugadores. Aceptamos grupos con menos participantes, pagando siempre el mínimo de 10 (en Paintball, reciben las bolas de los 10 para repartir entre el número efectivo). Para actividades de mayor tamaño, aceptamos hasta 150 jugadores por grupo.' },
  'Com quanta antecedência devo reservar?': { en: 'How far in advance should I book?', fr: 'Combien de temps à l’avance dois-je réserver ?', es: '¿Con cuánta antelación debo reservar?' },
  'Recomendamos reservar com pelo menos 48h úteis de antecedência. É possível reservar com um mínimo de 24h úteis, mas sujeito às últimas vagas disponíveis. Quanto mais cedo, maior a probabilidade de a data pretendida estar livre!':
    { en: 'We recommend booking at least 48 working hours in advance. Booking with a minimum of 24 working hours is possible, but subject to the last available slots. The earlier, the more likely your preferred date is free!', fr: 'Nous recommandons de réserver au moins 48 heures ouvrables à l’avance. Une réservation avec un minimum de 24 heures ouvrables est possible, mais soumise aux dernières disponibilités. Plus tôt vous réservez, plus la date souhaitée a de chances d’être libre !', es: 'Recomendamos reservar con al menos 48 horas hábiles de antelación. Es posible reservar con un mínimo de 24 horas hábiles, pero sujeto a las últimas plazas disponibles. ¡Cuanto antes, mayor probabilidad de que la fecha deseada esté libre!' },
  'Sou obrigado a fazer reserva/marcação?': { en: 'Am I required to book in advance?', fr: 'Suis-je obligé de réserver ?', es: '¿Estoy obligado a reservar?' },
  'Sim. A reserva só fica confirmada com o pagamento do sinal — é a única forma de poder jogar no Parque Emboscada.':
    { en: 'Yes. The booking is only confirmed once the deposit is paid — it’s the only way to play at Parque Emboscada.', fr: 'Oui. La réservation n’est confirmée qu’avec le paiement de l’acompte — c’est le seul moyen de jouer au Parque Emboscada.', es: 'Sí. La reserva solo se confirma con el pago de la señal — es la única forma de poder jugar en el Parque Emboscada.' },
  'Posso cancelar a minha atividade?': { en: 'Can I cancel my activity?', fr: 'Puis-je annuler mon activité ?', es: '¿Puedo cancelar mi actividad?' },
  'Sim: com aviso por e-mail com 24 horas úteis de antecedência, pode reagendar para outro dia sem perder o valor da reserva; com 48 horas úteis de antecedência, pode cancelar com devolução do valor da reserva.':
    { en: 'Yes: with email notice 24 working hours in advance, you can reschedule to another day without losing the deposit; with 48 working hours’ notice, you can cancel with a refund of the deposit.', fr: 'Oui : avec un préavis par e-mail de 24 heures ouvrables, vous pouvez reporter à un autre jour sans perdre l’acompte ; avec 48 heures ouvrables de préavis, vous pouvez annuler avec remboursement de l’acompte.', es: 'Sí: con aviso por correo con 24 horas hábiles de antelación, puede reprogramar para otro día sin perder el importe de la reserva; con 48 horas hábiles de antelación, puede cancelar con devolución del importe de la reserva.' },
  'As atividades acontecem quando está a chover?': { en: 'Do activities go ahead when it’s raining?', fr: 'Les activités ont-elles lieu quand il pleut ?', es: '¿Las actividades se realizan cuando llueve?' },
  'Sim. As atividades são ajustáveis e realizáveis em condições atmosféricas adversas, incluindo chuva, vento ou frio. Recomendamos que todos levem uma muda de roupa extra, especialmente as crianças.':
    { en: 'Yes. Activities are adaptable and can go ahead in adverse weather, including rain, wind or cold. We recommend everyone brings a spare change of clothes, especially children.', fr: 'Oui. Les activités sont adaptables et réalisables par conditions météo défavorables, y compris pluie, vent ou froid. Nous recommandons à chacun d’apporter des vêtements de rechange, surtout les enfants.', es: 'Sí. Las actividades son adaptables y realizables en condiciones meteorológicas adversas, incluyendo lluvia, viento o frío. Recomendamos que todos lleven una muda de ropa extra, especialmente los niños.' },
  'Existem balneários?': { en: 'Are there changing rooms?', fr: 'Y a-t-il des vestiaires ?', es: '¿Hay vestuarios?' },
  'No Parque Emboscada Lisboa (Monsanto), dentro do Lisboa Camping & Bungalows, existem balneários de utilização partilhada. Os duches funcionam a caldeira (água quente limitada) e não têm champô nem toalhas — cada pessoa deve trazer o que precisar. Questione o seu Monitor sobre o bloco mais próximo.':
    { en: 'At Parque Emboscada Lisboa (Monsanto), inside Lisboa Camping & Bungalows, there are shared changing rooms. Showers run on a boiler (limited hot water) and have no shampoo or towels — everyone should bring what they need. Ask your Monitor about the nearest block.', fr: 'Au Parque Emboscada Lisboa (Monsanto), à l’intérieur du Lisboa Camping & Bungalows, il y a des vestiaires à usage partagé. Les douches fonctionnent avec une chaudière (eau chaude limitée) et n’ont ni shampoing ni serviettes — chacun doit apporter ce dont il a besoin. Demandez à votre moniteur le bloc le plus proche.', es: 'En el Parque Emboscada Lisboa (Monsanto), dentro del Lisboa Camping & Bungalows, hay vestuarios de uso compartido. Las duchas funcionan con caldera (agua caliente limitada) y no tienen champú ni toallas — cada persona debe traer lo que necesite. Pregunte a su monitor por el bloque más cercano.' },
  'Existem zonas cobertas ou zonas de espera?': { en: 'Are there covered areas or waiting areas?', fr: 'Y a-t-il des zones couvertes ou des zones d’attente ?', es: '¿Hay zonas cubiertas o zonas de espera?' },
  'O nosso parque é outdoor; a zona de receção, jogadores e briefing é coberta. Existem zonas de espera para os restantes visitantes, que devem seguir as indicações de segurança dos monitores.':
    { en: 'Our park is outdoor; the reception, players and briefing area is covered. There are waiting areas for other visitors, who must follow the monitors’ safety instructions.', fr: 'Notre parc est en plein air ; la zone d’accueil, des joueurs et de briefing est couverte. Des zones d’attente sont prévues pour les autres visiteurs, qui doivent suivre les consignes de sécurité des moniteurs.', es: 'Nuestro parque es al aire libre; la zona de recepción, jugadores y briefing está cubierta. Hay zonas de espera para el resto de visitantes, que deben seguir las indicaciones de seguridad de los monitores.' },
  'Tenho de chegar mais cedo do que a hora marcada?': { en: 'Do I need to arrive earlier than the booked time?', fr: 'Dois-je arriver plus tôt que l’heure prévue ?', es: '¿Tengo que llegar antes de la hora reservada?' },
  'Recomendamos que o grupo se reúna 10 a 15 minutos antes da hora marcada para evitar atrasos. O check-in deve ser feito com o grupo todo junto.':
    { en: 'We recommend the group gathers 10 to 15 minutes before the booked time to avoid delays. Check-in should be done with the whole group together.', fr: 'Nous recommandons au groupe de se réunir 10 à 15 minutes avant l’heure prévue pour éviter les retards. L’enregistrement doit se faire avec tout le groupe ensemble.', es: 'Recomendamos que el grupo se reúna 10 a 15 minutos antes de la hora reservada para evitar retrasos. El check-in debe hacerse con todo el grupo junto.' },
  'Existe estacionamento disponível?': { en: 'Is parking available?', fr: 'Un parking est-il disponible ?', es: '¿Hay aparcamiento disponible?' },
  'Sim, embora exista uma limitação de viaturas autorizadas a entrar no recinto por atividade. À entrada do Lisboa Camping & Bungalows existe estacionamento disponível, cuja lotação não conseguimos controlar.':
    { en: 'Yes, although there is a limit on the number of vehicles allowed into the grounds per activity. There is parking at the entrance of Lisboa Camping & Bungalows, whose capacity we cannot control.', fr: 'Oui, bien qu’il y ait une limite du nombre de véhicules autorisés à entrer sur le site par activité. Un parking est disponible à l’entrée du Lisboa Camping & Bungalows, dont nous ne pouvons pas contrôler la capacité.', es: 'Sí, aunque existe una limitación de vehículos autorizados a entrar al recinto por actividad. A la entrada del Lisboa Camping & Bungalows hay aparcamiento disponible, cuya ocupación no podemos controlar.' },
  'Podemos fazer mais que uma atividade?': { en: 'Can we do more than one activity?', fr: 'Pouvons-nous faire plus d’une activité ?', es: '¿Podemos hacer más de una actividad?' },
  'Sim, é possível fazer packs de atividades combinadas. Peça mais informações no momento da pré-reserva.':
    { en: 'Yes, combined activity packs are possible. Ask for more information when you pre-book.', fr: 'Oui, des packs d’activités combinées sont possibles. Demandez plus d’informations lors de la pré-réservation.', es: 'Sí, es posible hacer packs de actividades combinadas. Pida más información en el momento de la prerreserva.' },
  'O material de Paintball é igual para todas as idades?': { en: 'Is the paintball equipment the same for all ages?', fr: 'L’équipement de paintball est-il le même pour tous les âges ?', es: '¿El material de paintball es igual para todas las edades?' },
  'Não. Existem diferentes equipamentos recomendados consoante o escalão do grupo.':
    { en: 'No. Different equipment is recommended depending on the group’s age tier.', fr: 'Non. Différents équipements sont recommandés selon la catégorie d’âge du groupe.', es: 'No. Existen diferentes equipos recomendados según la categoría del grupo.' },
  'Qual a localização exata? Como se vai para o Parque Emboscada?': { en: 'What is the exact location? How do I get to Parque Emboscada?', fr: 'Quelle est la localisation exacte ? Comment se rendre au Parque Emboscada ?', es: '¿Cuál es la ubicación exacta? ¿Cómo se llega al Parque Emboscada?' },
  'O nosso espaço fica dentro do Parque de Campismo de Monsanto e todas as entradas têm de ser validadas. O percurso pode ser feito de carro (com limitações no número de viaturas) ou a pé, seguindo as placas indicativas. UBER, táxis e outras empresas de transporte estão proibidos de circular dentro do recinto.':
    { en: 'Our space is inside the Monsanto Campsite and all entries must be validated. You can get there by car (with limits on the number of vehicles) or on foot, following the signs. UBER, taxis and other transport companies are not allowed inside the grounds.', fr: 'Notre espace se trouve à l’intérieur du camping de Monsanto et toutes les entrées doivent être validées. Le trajet peut se faire en voiture (avec des limites sur le nombre de véhicules) ou à pied, en suivant les panneaux. UBER, taxis et autres sociétés de transport sont interdits de circulation à l’intérieur du site.', es: 'Nuestro espacio está dentro del Camping de Monsanto y todas las entradas deben validarse. El recorrido puede hacerse en coche (con limitaciones en el número de vehículos) o a pie, siguiendo las señales. UBER, taxis y otras empresas de transporte tienen prohibido circular dentro del recinto.' },
};

// Context is created here and consumed by the hooks; the Provider component
// lives in LanguageProvider.jsx (kept separate so this module exports no
// component — required for React Fast Refresh / eslint).
export const LanguageContext = createContext({ lang: 'pt', setLang: () => {} });

export const useLang = () => useContext(LanguageContext);

// Returns a translator: t('PT string') → localized string (PT text if no entry).
export const useT = () => {
  const { lang } = useContext(LanguageContext);
  return useCallback((str) => {
    if (lang === 'pt' || !str) return str;
    const entry = T[str];
    return (entry && entry[lang]) || str;
  }, [lang]);
};
