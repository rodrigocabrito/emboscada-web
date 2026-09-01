// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SITE CONTENT — single source of truth.
//
// Edit copy, images, contacts, nav and per-page text HERE. Every public
// component reads from this file, so non-code updates stay in one place.
//
// Images are self-hosted in /public/site (served at /site/…). To swap one, drop
// the new file in public/site and update its path below — nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

// Languages offered by the public site's flag switcher (pt = source language).
export const LANGS = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export const site = {
  name: 'Emboscada Parque Aventura',
  logo: '/site/logo-white.svg',
  tagline: 'Paintball · Lasertag · Bubble Football',
  safetyBadge: '/site/clean-safe.png',
  clientsBadge: '/site/clients.png',
};

// Top navigation (public). NOTE: the staff portal (/portal) is intentionally
// NOT listed here — it stays hidden from the public.
// The header already has a "Reservar" CTA button pointing at /reservations, so
// there's no separate "Reservas" nav item (it would be a duplicate).
export const nav = [
  { label: 'Home', to: '/' },
  { label: 'Adultos', to: '/adults' },
  { label: 'Crianças', to: '/kids' },
  { label: 'Empresas', to: '/companies' },
  { label: 'Campos', to: '/fields' },
  { label: 'Contactos', to: '/contacts' },
];

// Browser-tab titles per route (PT keys, translated at runtime). Home shows the
// bare brand; every other page becomes "<translated page> · Emboscada Parque
// Aventura". Location names (Porto/Monsanto) are proper nouns and fall through
// untranslated.
export const pageTitles = {
  '/': '',
  '/adults': 'Adultos',
  '/kids': 'Crianças',
  '/companies': 'Empresas',
  '/fields': 'Campos',
  '/fields/porto': 'Porto',
  '/fields/monsanto': 'Monsanto',
  '/contacts': 'Contactos',
  '/reservations': 'Reservas',
  '/faqs': 'Perguntas Frequentes',
  '/privacy': 'Política de Privacidade',
};

// Meta descriptions per route. Portuguese — the primary market and the language
// Google indexes for these single-URL pages. ~150 chars, unique per page.
export const pageMeta = {
  '/': 'Paintball, lasertag, gelblast e bubble football no Porto e em Lisboa (Monsanto). Diversão em segurança para grupos, empresas, aniversários e despedidas.',
  '/adults': 'Paintball e lasertag para adultos no Porto e em Lisboa. Packs para grupos, despedidas de solteiro e amigos, com monitorização em todos os jogos.',
  '/kids': 'Paintball, lasertag e gelblast para crianças em segurança. Perfeito para festas de aniversário e grupos, no Porto e em Lisboa.',
  '/companies': 'Team building e eventos de empresa no Porto e em Lisboa. Paintball, lasertag e muito mais para grupos. Peça o seu orçamento à medida.',
  '/fields': 'Os nossos campos no Porto e em Lisboa (Monsanto): cenários, localização e galerias de fotos. Descobre onde vais viver a próxima aventura.',
  '/fields/porto': 'Campo de paintball e lasertag no Porto (Vila Nova de Gaia). Cenários, localização e galeria. Reserva a tua aventura na Emboscada.',
  '/fields/monsanto': 'Campo de paintball e lasertag em Lisboa (Monsanto). Cenários, localização e galeria. Reserva a tua aventura na Emboscada.',
  '/contacts': 'Contactos da Emboscada Parque Aventura no Porto e em Lisboa: telefone, email e morada. Fala connosco para reservar a tua experiência.',
  '/reservations': 'Pede a tua reserva de paintball, lasertag, gelblast ou bubble football no Porto ou em Lisboa. Preenche o formulário e confirmamos contigo.',
  '/faqs': 'Perguntas frequentes sobre reservas, idades, preços, equipamento e segurança na Emboscada Parque Aventura. Esclarece todas as tuas dúvidas.',
  '/privacy': 'Política de privacidade da Emboscada Parque Aventura: como recolhemos, tratamos e protegemos os teus dados pessoais.',
};

// Builds a tel: href from a display phone (Portuguese +351, digits only).
export const telHref = (phone) => `tel:+351${String(phone).replace(/\D/g, '')}`;

// ── Language in the URL (#9) ──
// Every language carries a path prefix, Portuguese included (/pt/adults,
// /en/adults, /fr/…, /es/…). The bare root redirects to /pt.
export const LOCALE_CODES = ['pt', 'en', 'fr', 'es'];

// Strip a leading /pt /en /fr /es segment → the canonical path used for content
// lookups and hreflang. Trailing slashes are normalised away.
export const canonicalPath = (pathname) => {
  const parts = pathname.split('/');
  const rest = LOCALE_CODES.includes(parts[1]) ? `/${parts.slice(2).join('/')}` : pathname;
  return rest === '/' || rest === '' ? '/' : rest.replace(/\/$/, '');
};

// Prefix a link target for a language. Preserves any ?query/#hash.
export const localizePath = (to, lang) => {
  if (typeof to !== 'string' || !to.startsWith('/')) return to;
  const q = to.search(/[?#]/);
  const path = q === -1 ? to : to.slice(0, q);
  const suffix = q === -1 ? '' : to.slice(q);
  return (path === '/' ? `/${lang}` : `/${lang}${path}`) + suffix;
};

// Rotating hero slides on the home page.
export const hero = [
  { title: 'PAINTBALL', subtitle: 'PARA CRIANÇAS, ADULTOS E FAMÍLIAS', image: '/site/hero-1.jpg' },
  { title: 'LASERTAG', subtitle: 'DIA E NOITE', image: '/site/hero-2.jpg' },
  { title: 'MONITORIZAÇÃO', subtitle: 'EM TODOS OS JOGOS', image: '/site/hero-3.jpg' },
  { title: 'TEAMBUILDING', subtitle: 'PARA EMPRESAS', image: '/site/hero-4.jpg' },
  { title: 'JOGOS À NOITE', subtitle: 'PAINTBALL OU LASERTAG', image: '/site/hero-5.jpg' },
  { title: 'ACTIVIDADES DE GRUPO', subtitle: 'PARA ESCOLAS E EMPRESAS', image: '/site/hero-6.jpg' },
];

// Category highlight cards under the hero.
export const categories = [
  { title: 'FESTAS DE ANIVERSÁRIO', image: '/site/cat-aniversario.jpg', to: '/kids' },
  { title: 'DESPEDIDAS DE SOLTEIRO', image: '/site/cat-despedidas.jpg', to: '/adults' },
  { title: 'EMPRESAS', subtitle: 'Team Building', image: '/site/cat-empresas.jpg', to: '/companies' },
  { title: 'GRUPOS', subtitle: 'Família e Amigos', image: '/site/cat-grupos.jpg', to: '/reservations' },
];

// "As nossas actividades"
export const activities = [
  { slug: 'paintball', title: 'PAINTBALL', icon: '/site/icon-paintball.png',
    blurb: 'E que tal um “Frente a Frente” com os seus amigos, família ou colegas de trabalho?' },
  { slug: 'bubble', title: 'BUBBLE FOOTBALL', icon: '/site/icon-bubble.png',
    blurb: 'Tem o sonho de pertencer à nossa seleção? Gosta de jogar futebol? Então imagine-se a jogar dentro de uma bolha!' },
  { slug: 'lasertag', title: 'LASERTAG', icon: '/site/icon-lasertag.png',
    blurb: 'Actividade de Lasertag num ambiente próprio e com presença de monitores.' },
];

// Activity options for the reservation / quote form dropdowns.
export const activityOptions = ['Paintball', 'Lasertag', 'Gelblast', 'Bubble Football'];

// Parks / locations.
export const parks = [
  { slug: 'monsanto', name: 'Monsanto', city: 'Lisboa', phone: '910 060 595', email: 'reservas@emboscadapaintball.pt', image: '/site/campo-monsanto.jpg' },
  { slug: 'porto', name: 'Porto', city: 'Porto', phone: '917 384 968', email: 'reservas@emboscadapaintball.pt', image: '/site/campo-porto.jpg' },
];

// Builds ['<prefix>1.jpg', … '<prefix>N.jpg'] — used for the numbered
// carousel/gallery image sets in public/site/<park>/.
const imgSet = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}.jpg`);

// Per-location detail pages (/fields/porto, /fields/monsanto).
export const locations = {
  porto: {
    name: 'Porto',
    title: 'Parque Porto',
    description: [
      'Situado em Canedo a 20 minutos do Porto, o nosso campo tem uma envolvência absolutamente natural, possibilitando uma «fuga» ao quotidiano. Com uma zona coberta para 200 pessoas, este espaço funde-se com o meio envolvente, fomentando o convívio, o descanso e a diversão.',
      'Entre Torres, Minas e Autocarro SWAT, o Parque Emboscada Porto oferece diversos cenários de paintball e ainda slide, escalada e Bubble Football. Se procura diversão e aventura, estamos à sua espera para lhe proporcionar uma experiência fantástica!',
    ],
    address: 'Rua do Salgueiral – Várzea, Freguesia Canedo, Vila Nova de Gaia',
    phone: '917 384 968',
    gps: '41°02\'10.8"N 8°28\'36.0"W',
    coords: { lat: 41.036333, lng: -8.476667 },
    howToGet: [
      'A cerca de 20 minutos do Porto, em Canedo (Vila Nova de Gaia). Estacionamento gratuito no local.',
    ],
    gallery: imgSet('/site/porto/gallery-', 18),
    // Game scenarios, each with its own photo carousel + 1–5 star stats.
    scenarios: [
      {
        name: 'SWAT',
        images: imgSet('/site/porto/swat-', 5),
        stats: [
          { label: 'Ataque', value: 4 },
          { label: 'Defesa', value: 2 },
          { label: 'Estratégia', value: 3 },
          { label: 'Artilharia', value: 3 },
        ],
      },
      {
        name: 'Ghost City',
        images: imgSet('/site/porto/ghost-', 5),
        stats: [
          { label: 'Ataque', value: 3 },
          { label: 'Defesa', value: 3 },
          { label: 'Estratégia', value: 4 },
          { label: 'Artilharia', value: 4 },
        ],
      },
    ],
  },
  monsanto: {
    name: 'Monsanto',
    title: 'Parque Lisboa – Monsanto',
    description: [
      'Situado no Parque de Campismo de Monsanto a 10 minutos do centro da cidade de Lisboa, o Parque Emboscada transmite adrenalina e emoção a quem o visita.',
      'Entre no ritmo citadino e teste a sua pontaria num confronto entre índios e cowboys no Western, ou explore os caminhos abandonados no nosso campo Factory. Atenção: quando visitar a Toxic City tenha cuidado com a exposição aos gases tóxicos que pairam no ar. Todos os cenários são criados para todos e ao gosto de todos.',
      'Para os mais corajosos, junte o grupo, teste os seus limites e jogue paintball nocturno! Se procura uma experiência única de diversão, o Parque Emboscada é a opção.',
    ],
    address: 'Lisboa Camping & Bungalows – Alto de Cabreira, Estrada da Circunvalação, Amadora',
    phone: '910 060 595',
    phone2: '+351 214 120 144',
    gps: '38°43\'29.5"N 9°12\'28.4"W',
    coords: { lat: 38.724861, lng: -9.207889 },
    howToGet: [
      'CARRIS — Autocarro 750: a 60 metros (1 min a pé).',
      'CARRIS — Autocarros 714 e 750: a 406 metros (1 min a pé).',
    ],
    gallery: imgSet('/site/monsanto/gallery-', 18),
    scenarios: [
      {
        name: 'Western',
        images: imgSet('/site/monsanto/western-', 5),
        stats: [
          { label: 'Ataque', value: 4 },
          { label: 'Defesa', value: 4 },
          { label: 'Estratégia', value: 5 },
          { label: 'Artilharia', value: 5 },
        ],
      },
      {
        name: 'Toxic City',
        images: imgSet('/site/monsanto/toxic-', 3),
        stats: [
          { label: 'Ataque', value: 4 },
          { label: 'Defesa', value: 5 },
          { label: 'Estratégia', value: 4 },
          { label: 'Artilharia', value: 4 },
        ],
      },
      {
        name: 'Factory',
        images: imgSet('/site/monsanto/factory-', 4),
        stats: [
          { label: 'Ataque', value: 4 },
          { label: 'Defesa', value: 5 },
          { label: 'Estratégia', value: 4 },
          { label: 'Artilharia', value: 5 },
        ],
      },
    ],
  },
};

export const contacts = {
  porto: {
    label: 'Contacto Porto',
    phone: '917 384 968',
    email: 'susana@emboscadapaintball.pt',
    address: 'Rua do Salgueiral – Várzea, Freguesia Canedo, Vila Nova de Gaia',
    gps: '41°02\'10.8"N 8°28\'36.0"W',
  },
  lisboa: {
    label: 'Contacto Lisboa',
    phone: '910 060 595',
    email: 'reservaslisboa@emboscadapaintball.pt',
    address: 'Lisboa Camping & Bungalows – Alto de Cabreira, Estrada da Circunvalação, 1400-061 Lisboa',
    gps: '38°43\'29.5"N 9°12\'28.4"W',
  },
};

export const schedule = { verao: '09:00 – 19:00', inverno: '09:00 – 18:00' };

export const footer = {
  quickLinks: [
    { label: 'Adultos', to: '/adults' },
    { label: 'Crianças', to: '/kids' },
    { label: 'Empresas', to: '/companies' },
  ],
  usefulLinks: [
    { label: 'Perguntas Frequentes', to: '/faqs' },
    { label: 'Contactos', to: '/contacts' },
    { label: 'Política de Privacidade', to: '/privacy' },
    { label: 'Livro de Reclamações', href: 'https://www.livroreclamacoes.pt/Inicio/' },
  ],
  legal: 'Empresa Certificada · Alvará RNAAT: 164/2021 · © Emboscada Parque Aventura',
};

// Activities + packs for the "Adultos" page. Prices are "per pessoa". Edit
// packs/prices/inclusions here — the Adultos page renders whatever is listed.
export const adultosActivities = [
  {
    slug: 'paintball',
    title: 'Paintball',
    from: '19,95€',
    age: 'A partir dos 16 anos',
    image: '/site/adultos-paintball.jpg',
    imagePos: 'center 22%', // bias the banner crop toward the top (heads/action)
    intro: 'Frente a frente com amigos, família ou colegas — em cenários imersivos e sempre com monitorização.',
    packs: [
      { name: 'Pack Paintball 100', price: '19,95', items: ['100 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68'] },
      { name: 'Pack Paintball 300', price: '27,95', items: ['300 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68'] },
      { name: 'Pack Paintball 500', price: '34,95', items: ['500 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68'] },
      { name: 'Ultra Paintball', price: '32,95', items: ['300 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68', 'Fato Macaco', 'Luvas'] },
      { name: 'Paintball Stag Party', price: '45,00', items: ['500 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68', 'Fato Macaco', 'Luvas', 'Fato Fantasia'] },
      { name: 'Extreme Paintball', price: '55,00', items: ['800 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 68', 'Fato Macaco', 'Luvas', 'Battle Pack', 'Potes de Bolas'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
      'Acesso a todos os cenários de jogo',
    ],
  },
  {
    slug: 'lasertag',
    title: 'Lasertag',
    from: '24,00€',
    age: 'A partir dos 16 anos',
    image: '/site/adultos-lasertag.jpg',
    imagePos: 'center 48%', // anchor foreground player's head near the top, show most of his body
    intro: 'Lasertag outdoor em cenários imersivos, de dia ou à noite, com monitorização em todos os jogos.',
    packs: [
      { name: 'Pack Base', price: '24,00', items: ['Tempo: 1h30', 'Headset', 'Marcador Falcon F1', 'Touca Higiénica'] },
      { name: 'Pack Aniversário', price: '28,00', items: ['Tempo: 2h00', 'Headset', 'Marcador Falcon F1', 'Fato Macaco', 'Touca Higiénica'] },
      { name: 'Pack Stag Party', price: '26,00', items: ['Tempo: 1h30', 'Headset', 'Marcador Falcon F1', 'Shock Band', 'Touca Higiénica', 'Fato Fantasia'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
      'Acesso a todos os cenários de jogo outdoor',
    ],
  },
  {
    slug: 'bubble',
    title: 'Bubble Football',
    from: '24,95€',
    age: 'A partir dos 16 anos',
    image: '/site/adultos-bubble.jpg',
    intro: 'Futebol dentro de uma bolha gigante. Bubble Football, Bowling, Sumo e King num campo 5x5.',
    packs: [
      { name: 'Pack Base Bubble Football', price: '24,95', items: ['Tempo: 1h30', 'Bumper Ball 1,50m', 'Campo de Futebol 5 x 5', 'Balizas e bola de futebol', 'Jogos: Football, Bowling, Sumo, King'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
    ],
  },
];

// Activities + packs for the "Criança" page.
export const criancaActivities = [
  {
    slug: 'paintball',
    title: 'Paintball',
    from: '19,95€',
    age: 'A partir dos 6 anos',
    image: '/site/crianca-paintball.jpg',
    imagePos: 'center 38%', // crop moved up ~75px total
    intro: 'Paintball infantil com marcador Cal 50 (baixo impacto). Escalões MINI (6–9) e KIDS (10–15).',
    packs: [
      { name: 'Pack Paintball 100', price: '19,95', items: ['100 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 50'] },
      { name: 'Pack Paintball 300', price: '27,95', items: ['300 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 50'] },
      { name: 'Pack Paintball 500', price: '34,95', items: ['500 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 50'] },
      { name: 'Pack Aniversário 150', price: '25,95', items: ['150 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 50', 'Fato Completo', 'Luvas'] },
      { name: 'Pack Especial Aniversário 300', price: '33,95', items: ['300 bolas', 'Máscara Térmica', 'Colete de Proteção', 'Marcador Cal 50', 'Fato Completo', 'Luvas', 'Lançador de Gelblast (oferta)'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
      'Acesso a todos os cenários de jogo',
      'Zona de Lanches (30 min) após a atividade',
    ],
  },
  {
    slug: 'lasertag',
    title: 'Lasertag',
    from: '24,00€',
    age: 'A partir dos 6 anos',
    image: '/site/crianca-lasertag.jpg',
    imagePos: 'center 14%', // crop moved up ~225px total
    intro: 'Lasertag outdoor em cenários imersivos, com monitorização em todos os jogos.',
    packs: [
      { name: 'Pack Lasertag', price: '24,00', items: ['Tempo: 1h30', 'Headset', 'Marcador Falcon F1', 'Touca Higiénica'] },
      { name: 'Pack Lasertag Aniversário', price: '28,00', items: ['Tempo: 2h00', 'Headset', 'Marcador Falcon F1', 'Fato Macaco', 'Touca Higiénica'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
      'Acesso a todos os cenários de jogo outdoor',
      'Zona de Lanches (30 min) após a atividade',
    ],
  },
  {
    slug: 'gelblast',
    title: 'Gelblast',
    from: '16,95€',
    age: 'Recomendável dos 6 aos 9 anos',
    image: '/site/crianca-gelblast.jpg',
    intro: 'Bolas de gel de baixo impacto, ideais para os mais novos. Duração 1h00–1h30.',
    packs: [
      { name: 'Pack Base Gelblast', price: '16,95', items: ['1500 bolas de gel por criança', 'Máscara com lente térmica', 'Colete de Proteção', 'Lançador Gelblast'] },
    ],
    includes: [
      'Briefing personalizado',
      'Monitorização e acompanhamento de todos os jogos',
      'Seguro de responsabilidade civil e de acidentes pessoais',
      'Acesso a todos os cenários de jogo',
      'Zona de Lanches (30 min) após a atividade',
    ],
  },
];

// Maps a route to its activity data + closing note. The ActivityPacksPage
// component reads from here, so /adults and /kids share one component.
export const packPages = {
  adultos: {
    activities: adultosActivities,
    note: 'Mínimo 10 jogadores. Consumos opcionais (fato, luvas, bolas extra) e mais detalhes na reserva.',
  },
  crianca: {
    activities: criancaActivities,
    note: 'Mínimo 10 jogadores. Inclui zona de lanches (30 min) após a atividade. Serviço de lanches e consumos opcionais disponíveis na reserva.',
  },
};

// Packs available per activity, grouped by audience (Adultos / Crianças) so the
// reservation form's "Pack" dropdown can show optgroups. Keyed by activity title
// ('Paintball', 'Lasertag', …); each value is [{ audience, packs: [name…] }].
export const packsByActivity = (() => {
  const map = {};
  const add = (activities, audience) => {
    activities.forEach((act) => {
      map[act.title] = map[act.title] || [];
      let group = map[act.title].find((g) => g.audience === audience);
      if (!group) { group = { audience, packs: [] }; map[act.title].push(group); }
      act.packs.forEach((pack) => { if (!group.packs.includes(pack.name)) group.packs.push(pack.name); });
    });
  };
  add(adultosActivities, 'Adultos');
  add(criancaActivities, 'Crianças');
  return map;
})();

// The value stored/submitted for a pack, disambiguating audience-specific packs
// that share a name (e.g. "Pack Paintball 100" exists for both audiences).
export const packValue = (name, audience) => `${name} (${audience})`;

// Per-page copy for the multi-page site. Expand these freely — the page
// components render whatever is here.
export const pages = {
  adultos: {
    title: 'Adultos',
    lead: 'Adrenalina para grupos de amigos, despedidas de solteiro e colegas de trabalho.',
    body: 'Paintball, Lasertag e Bubble Football num ambiente próprio, com monitorização em todos os jogos. Ideal para despedidas de solteiro, aniversários e convívios de grupo.',
  },
  crianca: {
    title: 'Crianças',
    lead: 'Festas de aniversário e actividades seguras, pensadas para os mais novos.',
    body: 'Paintball infantil (com marcadores de baixo impacto) e Lasertag, sempre acompanhados por monitores. Diversão em segurança para festas de aniversário e grupos escolares.',
  },
  empresas: {
    title: 'Empresas',
    lead: 'Team building que junta a equipa e liberta o espírito competitivo.',
    carousel: [
      '/site/emp-carousel-1.jpg',
      '/site/emp-carousel-2.jpg',
      '/site/emp-carousel-3.jpg',
      '/site/emp-carousel-4.jpg',
    ],
    clientLogos: [
      '/site/emp-clients-1.jpg',
      '/site/emp-clients-2.jpg',
    ],
    intro: [
      'Seja no campo de Monsanto ou Porto, por umas horas, uma manhã ou um dia, a sua empresa vai encontrar em qualquer Parque Emboscada espaços rodeados de natureza. De uma forma descontraída e divertida, proporcionamos momentos repletos de adrenalina e uma quebra total com a rotina do dia-a-dia.',
      'Tudo começa com «Era uma vez»… Quer pôr à prova diversas competências que levará consigo para fora do campo e para o local de trabalho? Seja a defender a sua aldeia de um ataque de índios ou a resgatar o CEO da sua organização de uma emboscada numa fábrica abandonada. Eis algumas das competências que cada um poderá evidenciar e/ou reforçar:',
    ],
    competencias: [
      'Trabalho em equipa',
      'Espírito de camaradagem e confiança entre colegas',
      'Qualidade de liderança',
      'Reforço de auto-confiança',
      'Melhorias no processo de tomada de decisão',
    ],
    tagline: 'Tudo o resto é pura diversão!',
    activities: ['Paintball', 'Lasertag', 'Bubble Football', 'Slide e Escalada', 'Festas', 'Team Building'],
    about: [
      'Desde 2001 que trabalhamos em conjunto com os nossos clientes para construir experiências memoráveis, à medida de cada evento ou team building.',
      'Encontra disponível todo o equipamento necessário (máscara, fato, marcador, luvas, colete, monitor, seguro, ar ilimitado) para todos os jogadores, e em todos os jogos são acompanhados por monitores experientes.',
      'Os Parques Emboscada variam em capacidade, podendo acomodar de 20 a 150 ou 300 pessoas (dependendo da localização). Contamos ainda com o apoio de vários parceiros externos, de modo a adequar a oferta aos vários momentos do dia — sendo possível acrescentar actividades adicionais ou refeições para todos os gostos.',
    ],
  },
  campos: {
    title: 'Campos',
    lead: 'Dois parques para escolher — Monsanto (Lisboa) e Porto.',
  },
  contactos: {
    title: 'Contactos',
    lead: 'Fala connosco para reservar ou tirar dúvidas.',
  },
  reservas: {
    title: 'Reservas',
    lead: 'Pede a tua reserva e entramos em contacto para confirmar.',
  },
  faqs: {
    title: 'Perguntas Frequentes',
    lead: 'As dúvidas mais comuns sobre as nossas actividades.',
    items: [
      { q: 'Quais são as regras de um jogo de Paintball?', a: 'Antes de começar a jogar, todos os jogadores recebem um briefing explicativo por parte do Monitor responsável pela sessão.' },
      { q: 'Existe algum sítio para deixar os pertences?', a: 'Não temos cacifos disponíveis, pelo que o ideal é guardar tudo no carro sem estar à vista. Não nos responsabilizamos por pertences deixados ao acaso no Parque.' },
      { q: 'O que devo vestir?', a: 'Recomendamos calçado e roupa confortável, de preferência lavável. Pode sempre alugar um fato-macaco — informe-se junto do seu Monitor.' },
      { q: 'A tinta das bolas estraga a roupa?', a: 'As nossas bolas são biodegradáveis, maioritariamente compostas por amido de milho, óleos de peixe e corante. Nada na sua composição deixa nódoas ou marcas permanentes nos tecidos.' },
      { q: 'Qual a idade mínima para jogar Paintball?', a: 'A idade mínima aconselhada são os 6 anos de idade no caso do pack MINI, e 9/10 anos no caso do pack KIDS.' },
      { q: 'Preciso pagar alguma coisa extra no dia?', a: 'Os preços dos packs incluem todo o material base de segurança necessário para a atividade. Apenas paga extras caso consuma — água, carregamentos de bolas adicionais, fatos e/ou luvas, etc.' },
      { q: 'Posso levar o meu próprio equipamento?', a: 'Clientes da Loja Emboscada com material próprio poderão levar o seu material mediante pedido prévio.' },
      { q: 'Temos de escolher todos o mesmo Pack?', a: 'Não é obrigatório, mas recomendamos que todos os jogadores partam com o mesmo número de bolas, para evitar que uns fiquem sem bolas antes dos outros. É sempre possível comprar bolas adicionais no final.' },
      { q: 'Podemos comprar bolas adicionais depois de acabarem as do Pack escolhido?', a: 'Sim. No Parque pode adquirir carregamentos de bolas extra junto do Monitor da atividade.' },
      { q: 'Posso levar bolas de casa?', a: 'Não. As bolas têm de ser compradas no Parque Emboscada, com a exceção de clientes da Loja Emboscada com material próprio, mediante pedido prévio.' },
      { q: 'Posso levar comida e bebida?', a: 'Sim, pode trazer comida e bebida (exceto bebidas alcoólicas) e utilizar a nossa zona coberta ou semicoberta. A utilização deste espaço para lanches em festas de aniversário requer comunicação prévia no ato de reserva e está sujeita à nossa disponibilidade e às regras de utilização do espaço.' },
      { q: 'Posso encomendar serviço de lanches?', a: 'No Parque Emboscada Lisboa (Monsanto) é possível contratar serviço de lanches através dos nossos parceiros do Monsanto Villas Restaurante. Deve ser encomendado com um mínimo de 48 horas úteis de antecedência, sendo servido no bar/restaurante do Lisboa Camping & Bungalows.' },
      { q: 'Em que dias o Parque está aberto?', a: 'O Parque está aberto mediante marcação, 365 dias por ano.' },
      { q: 'Preciso de pagar alguma coisa para fazer a reserva?', a: 'Sim. As reservas devem ser feitas com um mínimo de 24 horas úteis de antecedência e carecem de pagamento antecipado: 50,00€ para grupos estimados entre 10 e 14 jogadores (1 Monitor) e 80,00€ para grupos acima de 15 jogadores (2 ou mais monitores). Este valor é posteriormente descontado no valor total da atividade, a liquidar no próprio dia.' },
      { q: 'Qual o horário das sessões?', a: 'O Parque pode operar de 2ª a Domingo das 09h00 às 22h00, com ajustes conforme a época. No Inverno as sessões decorrem normalmente entre as 09h00 e as 18h00; na Primavera e Verão podem estender-se até às 22h00. No Inverno começa a escurecer mais cedo, pelo que horários mais tardios têm acesso apenas aos campos 1 e 2 (luz artificial).' },
      { q: 'Como posso pagar o sinal?', a: 'O pagamento do sinal pode ser feito por Transferência Bancária, Referência Multibanco, MBWAY ou PayPal. O restante pagamento é efetuado no parque (Multibanco, MBWAY ou Numerário) e deve ser assegurado pelo organizador, que recolhe o pagamento de todos os jogadores.' },
      { q: 'Quantos jogadores são necessários para marcar um jogo?', a: 'O número mínimo é de 10 jogadores. Aceitamos grupos com menos participantes, pagando sempre o mínimo de 10 (no Paintball, recebem as bolas dos 10 para dividir pelo número efetivo). Para atividades de maior dimensão, aceitamos até 150 jogadores por grupo.' },
      { q: 'Com quanta antecedência devo reservar?', a: 'Recomendamos reservar com pelo menos 48h úteis de antecedência. É possível reservar com um mínimo de 24h úteis, mas sujeito às últimas vagas disponíveis. Quanto mais cedo, maior a probabilidade de a data pretendida estar livre!' },
      { q: 'Sou obrigado a fazer reserva/marcação?', a: 'Sim. A reserva só fica confirmada com o pagamento do sinal — é a única forma de poder jogar no Parque Emboscada.' },
      { q: 'Posso cancelar a minha atividade?', a: 'Sim: com aviso por e-mail com 24 horas úteis de antecedência, pode reagendar para outro dia sem perder o valor da reserva; com 48 horas úteis de antecedência, pode cancelar com devolução do valor da reserva.' },
      { q: 'As atividades acontecem quando está a chover?', a: 'Sim. As atividades são ajustáveis e realizáveis em condições atmosféricas adversas, incluindo chuva, vento ou frio. Recomendamos que todos levem uma muda de roupa extra, especialmente as crianças.' },
      { q: 'Existem balneários?', a: 'No Parque Emboscada Lisboa (Monsanto), dentro do Lisboa Camping & Bungalows, existem balneários de utilização partilhada. Os duches funcionam a caldeira (água quente limitada) e não têm champô nem toalhas — cada pessoa deve trazer o que precisar. Questione o seu Monitor sobre o bloco mais próximo.' },
      { q: 'Existem zonas cobertas ou zonas de espera?', a: 'O nosso parque é outdoor; a zona de receção, jogadores e briefing é coberta. Existem zonas de espera para os restantes visitantes, que devem seguir as indicações de segurança dos monitores.' },
      { q: 'Tenho de chegar mais cedo do que a hora marcada?', a: 'Recomendamos que o grupo se reúna 10 a 15 minutos antes da hora marcada para evitar atrasos. O check-in deve ser feito com o grupo todo junto.' },
      { q: 'Existe estacionamento disponível?', a: 'Sim, embora exista uma limitação de viaturas autorizadas a entrar no recinto por atividade. À entrada do Lisboa Camping & Bungalows existe estacionamento disponível, cuja lotação não conseguimos controlar.' },
      { q: 'Podemos fazer mais que uma atividade?', a: 'Sim, é possível fazer packs de atividades combinadas. Peça mais informações no momento da pré-reserva.' },
      { q: 'O material de Paintball é igual para todas as idades?', a: 'Não. Existem diferentes equipamentos recomendados consoante o escalão do grupo.' },
      { q: 'Qual a localização exata? Como se vai para o Parque Emboscada?', a: 'O nosso espaço fica dentro do Parque de Campismo de Monsanto e todas as entradas têm de ser validadas. O percurso pode ser feito de carro (com limitações no número de viaturas) ou a pé, seguindo as placas indicativas. UBER, táxis e outras empresas de transporte estão proibidos de circular dentro do recinto.' },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    body: [
      'O Parque Emboscada, entidade pertencente à Emboscada – Organização de Eventos, Lda., preocupa-se em proteger a sua privacidade e irá processar e armazenar os seus dados pessoais, enquanto responsável pelo tratamento dos mesmos.',
      'Os dados pessoais recolhidos serão conservados até retirada do seu consentimento. No processo de adesão, os clientes expressam o seu consentimento quanto às finalidades de tratamento dos seus dados.',
      'A aceitação do tratamento de dados é prestada à Emboscada – Organização de Eventos, Lda.',
      'A aceitação dos termos de uso e de proteção de dados pessoais é obrigatória, sendo opcional a possibilidade de receber comunicações, a aceitação de análises de perfil e de localização.',
      'A não aceitação de comunicações e análises de perfil impossibilita o acesso a campanhas ajustadas ao seu perfil de consumo.',
      'É-lhe garantido o acesso, retificação, alteração, limitação do tratamento, portabilidade ou a eliminação dos seus dados pessoais, podendo tais direitos ser exercidos no site www.emboscadapaintball.com.',
      'A eliminação dos seus dados implica o cancelamento do consentimento para receber informações sobre a Emboscada – Organização de Eventos, Lda.',
      'Terá sempre o direito a apresentar uma reclamação à CNPD ou a outra autoridade de controlo competente nos termos da lei, caso entenda que o tratamento dos seus dados pela Emboscada – Organização de Eventos Lda. viola o regime legal em vigor a cada momento.',
      'Não são aceites registos de menores de idade.',
      'No compromisso de assegurar a segurança dos dados pessoais dos seus clientes, as Companhias implementaram as medidas de segurança técnica e organizacionais consideradas necessárias às atividades de recolha e processamento.',
      'Os dados recolhidos não são transferidos para terceiros sem o seu consentimento prévio.',
      'Os dados pessoais poderão ainda ser partilhados com outras entidades de acordo com: a) legislação aplicável; b) cumprimento de obrigações legais; c) ou na resposta a pedidos de autoridades públicas e governamentais.',
      'A Política de proteção de dados pessoais pode ser alterada em qualquer momento, com respeito pela legislação aplicável. As alterações serão comunicadas no site, entrando em vigor 10 dias úteis contados após a sua publicação no site.',
    ],
  },
};
