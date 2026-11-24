/* =========================================================
   1. DATOS DEL JUEGO: 17 ODS, CASAS, MISIONES Y RESIDUOS
   ========================================================= */
const STORAGE_KEY = 'ecocrossing_2030_save_v2';

const ODS_CATALOG = [
  { id: 'house_eco', ods: 11, name: 'Eco-Casa Solar', emoji: '🏠', cat: 'housing', cost: 65, eco: 3, happy: 7, energy: -1, income: 5, color: '#f97316', roof: '#991b1b', title: 'Vivienda Sostenible', fact: 'Las viviendas eficientes con buen aislamiento y energía limpia reducen el gasto diario de los hogares.' },
  { id: 'ods1', ods: 1, name: 'Banco Comunitario', emoji: '🏦', cat: 'economy', cost: 90, eco: 2, happy: 6, energy: -1, income: 6, color: '#e5243b', roof: '#b91c1c', title: 'Fin de la Pobreza', fact: 'Erradicar la pobreza extrema requiere garantizar acceso a recursos básicos y protección social para todos.' },
  { id: 'ods2', ods: 2, name: 'Huerto Urbano', emoji: '🥕', cat: 'nature', cost: 75, eco: 5, happy: 5, energy: 0, income: 4, color: '#dda63a', roof: '#84cc16', title: 'Hambre Cero', fact: 'La agricultura sostenible y los huertos locales reducen el transporte de alimentos y aseguran nutrición fresca.' },
  { id: 'ods3', ods: 3, name: 'Clínica Verde', emoji: '🏥', cat: 'social', cost: 110, eco: 2, happy: 9, energy: -2, income: 3, color: '#4c9f38', roof: '#f8fafc', title: 'Salud y Bienestar', fact: 'Los entornos urbanos limpios y verdes reducen enfermedades respiratorias y mejoran la salud.' },
  { id: 'ods4', ods: 4, name: 'Eco-Escuela', emoji: '🎓', cat: 'social', cost: 100, eco: 3, happy: 7, energy: -1, income: 4, color: '#c5192d', roof: '#f97316', title: 'Educación de Calidad', fact: 'La educación ambiental desde la infancia multiplica la conciencia ecológica de toda la sociedad.' },
  { id: 'ods5', ods: 5, name: 'Centro Igualdad', emoji: '⚖️', cat: 'social', cost: 95, eco: 2, happy: 8, energy: -1, income: 5, color: '#ff3a21', roof: '#ec4899', title: 'Igualdad de Género', fact: 'La participación equitativa impulsa comunidades más justas, innovadoras y prósperas.' },
  { id: 'ods6', ods: 6, name: 'Depuradora Solar', emoji: '💧', cat: 'nature', cost: 105, eco: 7, happy: 4, energy: -1, income: 3, color: '#26bde2', roof: '#0284c7', title: 'Agua Limpia', fact: 'Depurar y reutilizar el agua protege los ríos y garantiza el acceso universal al agua potable.' },
  { id: 'ods7', ods: 7, name: 'Parque Solar', emoji: '☀️', cat: 'energy', cost: 85, eco: 4, happy: 2, energy: 6, income: 5, color: '#fcc30b', roof: '#1e3a8a', title: 'Energía Limpia', fact: 'La energía solar fotovoltaica es una fuente limpia, inagotable y cada vez más accesible.' },
  { id: 'ods8', ods: 8, name: 'Taller Artesanal', emoji: '🧶', cat: 'economy', cost: 95, eco: 2, happy: 5, energy: -1, income: 9, color: '#a21942', roof: '#d97706', title: 'Trabajo Decente', fact: 'La economía circular y local crea empleos dignos sin agotar los recursos naturales.' },
  { id: 'ods9', ods: 9, name: 'Lab Innovación', emoji: '🔬', cat: 'economy', cost: 130, eco: 3, happy: 4, energy: -2, income: 11, color: '#fd6925', roof: '#475569', title: 'Industria e Innovación', fact: 'Invertir en investigación limpia acelera la transición ecológica de las ciudades.' },
  { id: 'ods10', ods: 10, name: 'Plaza Inclusiva', emoji: '🤝', cat: 'social', cost: 85, eco: 4, happy: 8, energy: 0, income: 3, color: '#dd1367', roof: '#a3e635', title: 'Reducción Desigualdades', fact: 'Los espacios públicos accesibles fortalecen la convivencia y el bienestar de todos los vecinos.' },
  { id: 'ods11', ods: 11, name: 'Tranvía Eléctrico', emoji: '🚊', cat: 'energy', cost: 120, eco: 6, happy: 6, energy: -2, income: 6, color: '#fd9d24', roof: '#0d9488', title: 'Ciudades Sostenibles', fact: 'El transporte público eléctrico reduce las emisiones de CO2 y mejora la calidad del aire urbano.' },
  { id: 'ods12', ods: 12, name: 'Punto Limpio', emoji: '♻️', cat: 'nature', cost: 80, eco: 6, happy: 3, energy: -1, income: 5, color: '#bf8b2e', roof: '#16a34a', title: 'Consumo Responsable', fact: 'Separar y reciclar residuos evita la extracción de nuevas materias primas y reduce vertederos.' },
  { id: 'ods13', ods: 13, name: 'Torre Eólica', emoji: '🌬️', cat: 'energy', cost: 115, eco: 6, happy: 2, energy: 8, income: 6, color: '#3f7e44', roof: '#e2e8f0', title: 'Acción por el Clima', fact: 'La energía eólica aprovecha la fuerza del viento para generar electricidad sin emisiones.' },
  { id: 'ods14', ods: 14, name: 'Reserva Marina', emoji: '🐠', cat: 'nature', cost: 110, eco: 8, happy: 5, energy: 0, income: 4, color: '#0a97d9', roof: '#0369a1', title: 'Vida Submarina', fact: 'Proteger los océanos y costas mantiene la biodiversidad marina y regula el clima global.' },
  { id: 'ods15', ods: 15, name: 'Bosque Nativo', emoji: '🌲', cat: 'nature', cost: 90, eco: 8, happy: 5, energy: 0, income: 3, color: '#56c02b', roof: '#15803d', title: 'Vida de Ecosistemas', fact: 'Los bosques absorben dióxido de carbono, previenen la erosión y albergan fauna vital.' },
  { id: 'ods16', ods: 16, name: 'Ágora de Paz', emoji: '🕊️', cat: 'social', cost: 105, eco: 3, happy: 9, energy: -1, income: 4, color: '#00689d', roof: '#f1f5f9', title: 'Paz y Justicia', fact: 'Las instituciones transparentes y el diálogo pacífico sostienen comunidades cohesionadas.' },
  { id: 'ods17', ods: 17, name: 'Faro Alianzas', emoji: '🌐', cat: 'economy', cost: 140, eco: 5, happy: 7, energy: 3, income: 10, color: '#19486a', roof: '#38bdf8', title: 'Alianzas Globales', fact: 'Compartir tecnología, conocimiento y financiación permite alcanzar los objetivos comunes.' }
];

const QUESTS = [
  { id: 'q_build_ods2', type: 'build', author: 'Alcalde Panda', avatar: '🐼', ods: 2, desc: 'Cultivemos alimentos sanos construyendo un Huerto Urbano nuevo.', targetId: 'ods2', reward: 95 },
  { id: 'q_build_house', type: 'build', author: 'Alcalde Panda', avatar: '🐼', ods: 11, desc: '¡Nuestros vecinos necesitan más hogares! Construye una Eco-Casa Solar.', targetId: 'house_eco', reward: 100 },
  { id: 'q_build_ods7', type: 'build', author: 'Ing. Zorro', avatar: '🦊', ods: 7, desc: 'Refuerza la red limpia instalando un nuevo Parque Solar.', targetId: 'ods7', reward: 105 },
  { id: 'q_cat_nature', type: 'category', author: 'Guardia Tortuga', avatar: '🐢', ods: 15, desc: 'Suma 2 edificios de Naturaleza para llenar su cromo.', targetCat: 'nature', targetDelta: 2, reward: 120 },
  { id: 'q_recycle', type: 'recycle', author: 'Chef Erizo', avatar: '🦔', ods: 12, desc: 'Completa una ronda en el minijuego de Reciclar para cuidar la isla.', reward: 100 },
  { id: 'q_build_ods3', type: 'build', author: 'Dra. Koala', avatar: '🐨', ods: 3, desc: 'Cuida la salud de los vecinos levantando una nueva Clínica Verde.', targetId: 'ods3', reward: 115 },
  { id: 'q_cat_social', type: 'category', author: 'Profe Búho', avatar: '🦉', ods: 4, desc: 'Impulsa la vida comunitaria construyendo 2 edificios Sociales.', targetCat: 'social', targetDelta: 2, reward: 125 },
  { id: 'q_eco_65', type: 'eco', author: 'Guardia Tortuga', avatar: '🐢', ods: 14, desc: 'Alcanza al menos 65% de Ecología plantando naturaleza y edificios verdes.', targetEco: 65, reward: 120 },
  { id: 'q_build_ods13', type: 'build', author: 'Ing. Zorro', avatar: '🦊', ods: 13, desc: 'Aprovecha el viento construyendo una nueva Torre Eólica.', targetId: 'ods13', reward: 120 },
  { id: 'q_energy_pos', type: 'energy_pos', author: 'Ing. Zorro', avatar: '🦊', ods: 7, desc: 'Mantén un balance eléctrico positivo (+MW) en tu ciudad.', reward: 110 },
  { id: 'q_cat_economy', type: 'category', author: 'Alcalde Panda', avatar: '🐼', ods: 8, desc: 'Fortalece el desarrollo sostenible con 2 edificios de Economía/Alianzas.', targetCat: 'economy', targetDelta: 2, reward: 135 },
  { id: 'q_build_ods11', type: 'build', author: 'Chef Erizo', avatar: '🦔', ods: 11, desc: 'Conecta los barrios construyendo un nuevo Tranvía Eléctrico.', targetId: 'ods11', reward: 125 },
  { id: 'q_build_ods17', type: 'build', author: 'Profe Búho', avatar: '🦉', ods: 17, desc: 'Sella la cooperación global construyendo un nuevo Faro Alianzas.', targetId: 'ods17', reward: 150 }
];

const RECYCLE_ITEMS = [
  { emoji: '🍌', name: 'Cáscara de plátano', bin: 'org' },
  { emoji: '🧴', name: 'Botella de plástico', bin: 'env' },
  { emoji: '📰', name: 'Periódico viejo', bin: 'pap' },
  { emoji: '🍾', name: 'Botella de vidrio', bin: 'vid' },
  { emoji: '🥫', name: 'Lata de refresco', bin: 'env' },
  { emoji: '📦', name: 'Caja de cartón', bin: 'pap' },
  { emoji: '🍎', name: 'Corazón de manzana', bin: 'org' },
  { emoji: '🫙', name: 'Tarro de mermelada', bin: 'vid' },
  { emoji: '🩹', name: 'Tirita usada', bin: 'res' },
  { emoji: '🪥', name: 'Cepillo de dientes viejo', bin: 'res' }
];

/* =========================================================
   2. ESTADO GLOBAL DEL JUEGO
   ========================================================= */
const MAX_GRID = 31;
const CENTER = Math.floor(MAX_GRID / 2);

const game = {
  coins: 420,
  planet: 50,
  happy: 60,
  timeMinutes: 12 * 60,
  islandRadius: 2,
  expandCount: 0,
  expandStep: 2,
  maxRadius: 14,
  selectedBuildId: null,
  activeFilter: 'all',
  demolishMode: false,
  questIndex: 0,
  questBaseCount: 0,
  questRecycleDone: false,
  questCompleted: false,
  recycleHighScore: 0,
  unlockedOds: new Set(['ods2']),
  victoryShown: false,
  musicEnabled: true,
  musicUserPaused: false,
  sfxEnabled: true,
  audioCtx: null,
  musicTimer: null,
  musicStep: 0,
  dynamicTimer: 0,
  grid: [],
  hoverCell: null,
  camX: 0,
  camY: 18,
  zoom: 0.95,
  minZoom: 0.38,
  maxZoom: 1.9,
  particles: [],
  floatingTexts: [],
  walkers: []
};