// Mirror Fight Prototype client logic

const SCREENS = {
  start: document.getElementById('screen-start'),
  join: document.getElementById('screen-join'),
  hero: document.getElementById('screen-hero'),
  route: document.getElementById('screen-route'),
  event: document.getElementById('screen-event'),
  battle: document.getElementById('screen-battle'),
  result: document.getElementById('screen-result')
};

const WS_URL = (() => {
  const DEFAULT_REMOTE = 'wss://mazepark-1.onrender.com';

  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('ws');
    if (override) {
      if (override === 'local') {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const port = window.location.port || '8787';
        return `${protocol}://${window.location.hostname || 'localhost'}:${port}`;
      }
      return override;
    }
  } catch (err) {
    // ignore invalid URLs and continue with defaults
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const port = window.location.port || '8787';
    return `${protocol}://${window.location.hostname}:${port}`;
  }

  return DEFAULT_REMOTE;
})();

document.getElementById('serverUrl').textContent = WS_URL;

// Storage helpers ---------------------------------------------------------
let storageAvailable = true;

function storageTest() {
  if (!storageAvailable) return;
  try {
    const testKey = '__mf_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch (err) {
    storageAvailable = false;
    setFooterMessage('Локальное сохранение недоступно (режим приватности?).');
  }
}

function storageGet(key) {
  if (!storageAvailable) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    storageAvailable = false;
    setFooterMessage('Локальное сохранение недоступно (режим приватности?).');
    return null;
  }
}

function storageSet(key, value) {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    storageAvailable = false;
    setFooterMessage('Локальное сохранение недоступно (режим приватности?).');
  }
}

function storageRemove(key) {
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    storageAvailable = false;
    setFooterMessage('Локальное сохранение недоступно (режим приватности?).');
  }
}

// Card library describing all card behaviour
const CARD_LIBRARY = {
  flame: {
    id: 'flame',
    name: 'Жар Пламени',
    type: 'attack',
    emoji: '🥊',
    rarity: 'common',
    once: false,
    description: 'Атака, 4 урона',
    baseDamage: 4
  },
  frost: {
    id: 'frost',
    name: 'Морозный Удар',
    type: 'attack',
    emoji: '🥊',
    rarity: 'common',
    once: false,
    description: 'Атака 3 и -1 к урону цели до конца раунда',
    baseDamage: 3,
    apply: 'frost'
  },
  shield: {
    id: 'shield',
    name: 'Щит Молний',
    type: 'defense',
    emoji: '🛡️',
    rarity: 'common',
    once: false,
    description: 'Блок 4 и 1 ответный урон',
    block: 4,
    reflect: 1
  },
  flash: {
    id: 'flash',
    name: 'Вспышка Ритма',
    type: 'spell',
    emoji: '✨',
    rarity: 'common',
    once: false,
    description: 'Следующая ваша карта в этом раунде ходит первой',
    effect: 'priority'
  },
  heal: {
    id: 'heal',
    name: 'Светлая Помощь',
    type: 'spell',
    emoji: '✨',
    rarity: 'common',
    once: false,
    description: 'Лечение 3 HP',
    heal: 3
  },
  ember: {
    id: 'ember',
    name: 'Пылающий След',
    type: 'attack',
    emoji: '🥊',
    rarity: 'common',
    once: false,
    description: 'Атака 3 и дополнительное 1 прямого урона от ожога',
    baseDamage: 3,
    effect: 'burn'
  },
  bastion: {
    id: 'bastion',
    name: 'Бастион Эха',
    type: 'defense',
    emoji: '🛡️',
    rarity: 'common',
    once: false,
    description: 'Плотный блок на 5 единиц',
    block: 5,
    reflect: 0
  },
  surge: {
    id: 'surge',
    name: 'Искра Фокусировки',
    type: 'spell',
    emoji: '✨',
    rarity: 'common',
    once: false,
    description: '+1 к урону ваших карт до конца раунда',
    effect: 'empower'
  },
  veil: {
    id: 'veil',
    name: 'Пелена Отражения',
    type: 'spell',
    emoji: '✨',
    rarity: 'common',
    once: false,
    description: 'Снимает штрафы урона и даёт блок 2',
    effect: 'cleanse',
    block: 2
  },
  power: {
    id: 'power',
    name: 'Взрыв Силы',
    type: 'attack',
    emoji: '🥊',
    rarity: 'rare',
    once: true,
    description: 'Мощная атака на 8 урона',
    baseDamage: 8
  },
  disrupt: {
    id: 'disrupt',
    name: 'Разрыв Ритма',
    type: 'spell',
    emoji: '✨',
    rarity: 'rare',
    once: true,
    description: 'Порядок слотов соперника меняется на 3→1',
    effect: 'reverse'
  },
  brand: {
    id: 'brand',
    name: 'Зеркальная метка',
    type: 'spell',
    emoji: '✨',
    rarity: 'rare',
    once: false,
    description: 'Помечает цель: следующий ваш удар +2 урона',
    effect: 'mark'
  },
  rupture: {
    id: 'rupture',
    name: 'Разлом Потока',
    type: 'attack',
    emoji: '🥊',
    rarity: 'rare',
    once: true,
    description: 'Атака 5, ударяет дважды',
    baseDamage: 5,
    effect: 'doubleHit'
  },
  fate: {
    id: 'fate',
    name: 'Клинок Судьбы',
    type: 'attack',
    emoji: '🥊',
    rarity: 'legendary',
    once: true,
    description: 'Если цель ≤50% HP — добивает',
    effect: 'execute'
  },
  wrath: {
    id: 'wrath',
    name: 'Гнев Двух Стихий',
    type: 'spell',
    emoji: '✨',
    rarity: 'legendary',
    once: true,
    description: '5 урона и вы первые в следующем раунде',
    baseDamage: 5,
    effect: 'wrath'
  },
  aegis: {
    id: 'aegis',
    name: 'Аегис Отголосков',
    type: 'defense',
    emoji: '🛡️',
    rarity: 'legendary',
    once: true,
    description: 'Блок 6 и 3 ответного урона',
    block: 6,
    reflect: 3
  }
};

const CARD_GLOSSARY = [
  { term: 'Блок', text: 'Поглощает входящий урон до указанного значения в текущем раунде.' },
  { term: 'Ответный урон', text: 'Наносит прямой урон атакующему, если удар был заблокирован.' },
  { term: 'Приоритет', text: 'Переносит ход вашей следующей карты на первое место раунда.' },
  { term: 'Модификатор урона', text: 'Суммарная поправка к урону карт до конца раунда.' },
  { term: 'Ожог', text: 'Наносит прямой урон, игнорируя блок.' },
  { term: 'Усиление', text: '+1 к урону до конца раунда. Складывается.' },
  { term: 'Метка', text: 'Следующая атака по цели получает +2 урона.' },
  { term: 'Пронзание', text: 'Игнорирует блок и наносит урон напрямую.' }
];

const HEROES = {
  mage: {
    id: 'mage',
    name: 'Маг',
    hp: 24,
    deck: ['flame', 'frost', 'flash', 'heal', 'shield', 'surge', 'veil', 'ember']
  },
  warrior: {
    id: 'warrior',
    name: 'Воин',
    hp: 28,
    deck: ['flame', 'flame', 'frost', 'shield', 'heal', 'bastion', 'surge', 'ember']
  }
};

const ENEMY_DB = window.ENEMY_DB || { cards: {}, enemies: [] };

function getEnemyById(enemyId) {
  return ENEMY_DB.enemies.find((enemy) => enemy.id === enemyId);
}

function createEnemyCardFromId(cardId) {
  const def = ENEMY_DB.cards[cardId];
  if (!def) {
    return { id: `enemy_unknown_${cardId}`, name: 'Неизвестный ход', type: 'spell', emoji: '✨', rarity: 'enemy', effect: 'none' };
  }
  return { ...def, id: `enemy_${cardId}`, rarity: 'enemy' };
}

function selectEnemyPattern(enemy, battle) {
  if (!enemy) return ['guard', 'guard', 'guard'];
  if (battle.round === 1 && enemy.patterns?.opener) {
    return enemy.patterns.opener;
  }
  if (battle.opponent.hp <= battle.opponent.maxHp / 2 && enemy.patterns?.enraged) {
    return enemy.patterns.enraged;
  }
  return enemy.patterns?.default || ['guard', 'slash', 'guard'];
}

// Persistent state keys
const STORAGE_KEYS = {
  hero: 'mf_hero',
  deck: 'mf_deck',
  route: 'mf_route_index',
  routeNodes: 'mf_route_nodes',
  routeMap: 'mf_route_map',
  routeProgress: 'mf_route_progress',
  routeCurrent: 'mf_route_current',
  runEffects: 'mf_run_effects',
  room: 'mf_room_code'
};

const state = {
  screen: 'start',
  heroId: null,
  heroHp: 0,
  heroMaxHp: 0,
  deck: [],
  routeIndex: 0,
  routeMap: null,
  routeProgress: [],
  routeCurrent: null,
  routeSelection: null,
  runEffects: {
    openingBlock: 0,
    openingStrike: 0
  },
  roomCode: null,
  playerDirectory: [],
  pvp: {
    role: null,
    ready: false,
    opponentReady: false,
    opponentSlots: [null, null, null],
    waitingTimeout: null
  },
  battle: null
};

let socket = null;
let reconnectTimeout = null;
const ui = { cardPreview: null };

// Utility functions -------------------------------------------------------
function logDebug(...args) {
  // eslint-disable-next-line no-console
  console.log('[MirrorFight]', ...args);
}

function showScreen(name) {
  Object.entries(SCREENS).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
  state.screen = name;
}

function setFooterMessage(msg) {
  const footerMessage = document.getElementById('footerMessage');
  footerMessage.textContent = msg;
}

function setWsStatus(status) {
  document.getElementById('wsStatus').textContent = status;
}

function updateRoomIndicator() {
  const roomEl = document.getElementById('footerRoom');
  if (!roomEl) return;
  if (state.pvp.role === 'host' && state.roomCode) {
    roomEl.textContent = `Комната: ${state.roomCode}`;
  } else if (state.roomCode) {
    roomEl.textContent = `Комната: ${state.roomCode}`;
  } else {
    roomEl.textContent = 'Комната: —';
  }
}

// Player discovery keeps QA aware of connected testers in real time.
function renderPlayerDirectory() {
  const container = document.getElementById('playerDirectory');
  if (!container) return;
  if (!state.playerDirectory.length) {
    container.textContent = 'Игроки не подключены.';
    return;
  }
  container.innerHTML = '';
  state.playerDirectory.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'directory-entry';
    const heroName = entry.heroName || '—';
    const stanceLabel = entry.stance === 'ambush' ? 'Засада' : 'Герой';
    const roomLabel = entry.roomCode || '—';
    const roomIndex = Number.isFinite(entry.routeIndex) ? entry.routeIndex + 1 : '—';
    const title = document.createElement('strong');
    title.textContent = `${heroName} (${stanceLabel})`;
    const room = document.createElement('span');
    room.textContent = `Маршрут: ${roomIndex}`;
    const code = document.createElement('span');
    code.textContent = `Код комнаты: ${roomLabel}`;
    item.appendChild(title);
    item.appendChild(room);
    item.appendChild(code);
    container.appendChild(item);
  });
}

// Lobby telemetry helpers keep QA view updated without manual refresh.
function determineStance() {
  return state.pvp.role === 'guest' ? 'ambush' : 'hero';
}

function syncPlayerStatus(extra = {}) {
  const payload = {
    type: 'PLAYER_STATUS',
    heroId: state.heroId,
    heroName: state.heroId ? HEROES[state.heroId].name : null,
    routeIndex: state.routeProgress.length,
    roomCode: state.roomCode,
    stance: determineStance(),
    ...extra
  };
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    sendWhenReady(payload);
  } else {
    sendToServer(payload);
  }
}

// Card inspection overlay ---------------------------------------------------
function openCardInfo(instanceId) {
  const instance = findCardInstance(instanceId);
  if (!instance) return;
  const overlay = document.getElementById('cardInfoOverlay');
  const title = document.getElementById('cardInfoTitle');
  const description = document.getElementById('cardInfoDescription');
  const stats = document.getElementById('cardInfoStats');
  const glossary = document.getElementById('cardInfoGlossary');
  const useButton = document.getElementById('cardInfoUse');
  const def = cardDefinitionForInstance(instance);
  ui.cardPreview = instanceId;
  title.textContent = `${def.emoji} ${def.name}`;
  description.textContent = def.description || 'Описание отсутствует.';
  stats.innerHTML = '';
  const infoPairs = [];
  infoPairs.push(['Тип', def.type === 'attack' ? 'Атака' : def.type === 'defense' ? 'Защита' : 'Заклинание']);
  infoPairs.push(['Редкость', def.rarity === 'common' ? 'Обычная' : def.rarity === 'rare' ? 'Редкая' : 'Легендарная']);
  infoPairs.push(['Одноразовая', def.once ? 'Да' : 'Нет']);
  if (def.baseDamage) infoPairs.push(['Урон', String(def.baseDamage)]);
  if (def.block) infoPairs.push(['Блок', String(def.block)]);
  if (def.reflect) infoPairs.push(['Ответ', String(def.reflect)]);
  if (def.heal) infoPairs.push(['Лечение', String(def.heal)]);
  infoPairs.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    stats.appendChild(dt);
    stats.appendChild(dd);
  });
  glossary.innerHTML = '';
  CARD_GLOSSARY.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.term}:</strong> ${entry.text}`;
    glossary.appendChild(li);
  });
  if (instance.inUse) {
    useButton.disabled = true;
    useButton.textContent = 'Карта уже размещена';
  } else {
    useButton.disabled = false;
    useButton.textContent = 'Разместить в следующий свободный слот';
  }
  overlay.classList.remove('hidden');
}

function closeCardInfo() {
  const overlay = document.getElementById('cardInfoOverlay');
  overlay.classList.add('hidden');
  ui.cardPreview = null;
}

function createCardInstance(cardId) {
  const card = CARD_LIBRARY[cardId];
  if (!card) throw new Error(`Unknown card ${cardId}`);
  return {
    instanceId: `${cardId}-${Math.random().toString(36).slice(2, 9)}`,
    cardId,
    once: card.once,
    rarity: card.rarity,
    inUse: false,
    burned: false
  };
}

function findCardInstance(instanceId) {
  return state.deck.find((inst) => inst.instanceId === instanceId);
}

function cardDefinitionForInstance(instance) {
  return CARD_LIBRARY[instance.cardId];
}

function savePersistentState() {
  if (state.heroId) {
    storageSet(STORAGE_KEYS.hero, state.heroId);
  }
  storageSet(STORAGE_KEYS.route, String(state.routeIndex));
  storageSet(STORAGE_KEYS.routeMap, JSON.stringify(state.routeMap));
  storageSet(STORAGE_KEYS.routeProgress, JSON.stringify(state.routeProgress));
  storageSet(STORAGE_KEYS.routeCurrent, JSON.stringify(state.routeCurrent));
  storageSet(STORAGE_KEYS.runEffects, JSON.stringify(state.runEffects));
  const deckPayload = state.deck.map((inst) => ({ cardId: inst.cardId, burned: inst.burned }));
  storageSet(STORAGE_KEYS.deck, JSON.stringify(deckPayload));
  if (state.roomCode && state.pvp.role === 'host') {
    storageSet(STORAGE_KEYS.room, state.roomCode);
  }
  syncPlayerStatus();
}

function clearPersistentState() {
  storageRemove(STORAGE_KEYS.hero);
  storageRemove(STORAGE_KEYS.deck);
  storageRemove(STORAGE_KEYS.route);
  storageRemove(STORAGE_KEYS.routeNodes);
  storageRemove(STORAGE_KEYS.routeMap);
  storageRemove(STORAGE_KEYS.routeProgress);
  storageRemove(STORAGE_KEYS.routeCurrent);
  storageRemove(STORAGE_KEYS.runEffects);
  storageRemove(STORAGE_KEYS.room);
}

function loadPersistentState() {
  const heroId = storageGet(STORAGE_KEYS.hero);
  const deckPayload = storageGet(STORAGE_KEYS.deck);
  const routeIndex = parseInt(storageGet(STORAGE_KEYS.route), 10);
  const routeNodes = storageGet(STORAGE_KEYS.routeNodes);
  const routeMap = storageGet(STORAGE_KEYS.routeMap);
  const routeProgress = storageGet(STORAGE_KEYS.routeProgress);
  const routeCurrent = storageGet(STORAGE_KEYS.routeCurrent);
  const runEffects = storageGet(STORAGE_KEYS.runEffects);
  const roomCode = storageGet(STORAGE_KEYS.room);
  if (heroId && HEROES[heroId]) {
    state.heroId = heroId;
    state.heroMaxHp = HEROES[heroId].hp;
    state.heroHp = HEROES[heroId].hp;
  }
  if (!Number.isNaN(routeIndex)) {
    state.routeIndex = routeIndex;
  }
  if (runEffects) {
    try {
      const parsed = JSON.parse(runEffects);
      state.runEffects = { ...state.runEffects, ...parsed };
    } catch (err) {
      logDebug('Failed to parse run effects', err);
    }
  }
  if (deckPayload) {
    try {
      const parsed = JSON.parse(deckPayload);
      state.deck = parsed.filter((entry) => !entry.burned).map((entry) => createCardInstance(entry.cardId));
    } catch (err) {
      logDebug('Failed to parse deck payload', err);
    }
  }
  if (roomCode) {
    state.roomCode = roomCode;
  }

  if (routeMap) {
    try {
      state.routeMap = JSON.parse(routeMap);
    } catch (err) {
      logDebug('Failed to parse route map', err);
    }
  }
  if (routeProgress) {
    try {
      state.routeProgress = JSON.parse(routeProgress) || [];
      state.routeIndex = state.routeProgress.length;
    } catch (err) {
      logDebug('Failed to parse route progress', err);
    }
  }
  if (routeCurrent) {
    try {
      state.routeCurrent = JSON.parse(routeCurrent);
    } catch (err) {
      logDebug('Failed to parse route current', err);
    }
  }

  if (!state.routeMap && routeNodes) {
    try {
      const legacyNodes = JSON.parse(routeNodes) || [];
      const migrated = buildLinearRouteMap(legacyNodes, state.routeIndex);
      state.routeMap = migrated.map;
      state.routeProgress = migrated.progress;
      state.routeIndex = state.routeProgress.length;
    } catch (err) {
      logDebug('Failed to migrate legacy route nodes', err);
    }
  }
}

function resetRun() {
  state.heroId = null;
  state.heroHp = 0;
  state.heroMaxHp = 0;
  state.deck = [];
  state.routeIndex = 0;
  state.routeMap = null;
  state.routeProgress = [];
  state.routeCurrent = null;
  state.routeSelection = null;
  state.runEffects = { openingBlock: 0, openingStrike: 0 };
  state.roomCode = null;
  state.pvp.role = null;
  state.pvp.opponentReady = false;
  state.pvp.opponentSlots = [null, null, null];
  state.pvp.ready = false;
  savePersistentState();
  storageRemove(STORAGE_KEYS.room);
  updateRoomIndicator();
}

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function getEnemyByTier(tier) {
  const pool = ENEMY_DB.enemies.filter((enemy) => enemy.tier === tier);
  return pickRandom(pool) || pool[0] || null;
}

function pickRandomDistinct(list, count) {
  const available = [...list];
  const picked = [];
  while (available.length && picked.length < count) {
    const index = Math.floor(Math.random() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
}

function buildRouteMap() {
  const tier1 = ENEMY_DB.enemies.filter((enemy) => enemy.tier === 1);
  const tier2 = ENEMY_DB.enemies.filter((enemy) => enemy.tier === 2);
  const tier3 = ENEMY_DB.enemies.filter((enemy) => enemy.tier === 3);
  const eventPool = EVENT_LIBRARY.filter((event) => event.id !== 'camp');

  const floors = [];
  const nodes = {};
  const specs = [
    { kind: 'battle', tier: 1, countRange: [2, 3] },
    { kind: 'event', countRange: [2, 3] },
    { kind: 'battle', tier: 2, countRange: [2, 3] },
    { kind: 'mix', tier: 2, countRange: [2, 3] },
    { kind: 'camp', countRange: [2, 3] },
    { kind: 'battle', tier: 3, countRange: [1, 1] }
  ];

  const createNode = (payload) => {
    const id = `node_${payload.floor}_${payload.column}_${Math.random().toString(36).slice(2, 7)}`;
    const node = {
      id,
      type: payload.type,
      floor: payload.floor,
      column: payload.column,
      enemyId: payload.enemyId || null,
      eventId: payload.eventId || null,
      next: []
    };
    nodes[id] = node;
    return node;
  };

  specs.forEach((spec, floorIndex) => {
    const [minCount, maxCount] = spec.countRange;
    const nodeCount = minCount === maxCount ? minCount : minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const floorNodes = [];
    let campPlaced = false;
    for (let column = 0; column < nodeCount; column += 1) {
      if (spec.kind === 'battle') {
        const pool = spec.tier === 1 ? tier1 : spec.tier === 2 ? tier2 : tier3;
        const enemy = pickRandom(pool) || pool[0] || getEnemyByTier(spec.tier);
        if (!enemy) continue;
        floorNodes.push(createNode({ floor: floorIndex, column, type: 'battle', enemyId: enemy.id }));
      } else if (spec.kind === 'event') {
        const event = pickRandom(eventPool) || EVENT_LIBRARY[0];
        floorNodes.push(createNode({ floor: floorIndex, column, type: 'event', eventId: event?.id }));
      } else if (spec.kind === 'mix') {
        const usePvp = Math.random() < 0.35;
        if (usePvp) {
          floorNodes.push(createNode({ floor: floorIndex, column, type: 'pvp' }));
        } else {
          const enemy = pickRandom(tier2) || tier2[0] || getEnemyByTier(2);
          if (!enemy) continue;
          floorNodes.push(createNode({ floor: floorIndex, column, type: 'battle', enemyId: enemy.id }));
        }
      } else if (spec.kind === 'camp') {
        if (!campPlaced && Math.random() < 0.5) {
          campPlaced = true;
          floorNodes.push(createNode({ floor: floorIndex, column, type: 'event', eventId: 'camp' }));
        } else {
          const event = pickRandom(eventPool) || EVENT_LIBRARY[0];
          floorNodes.push(createNode({ floor: floorIndex, column, type: 'event', eventId: event?.id }));
        }
      }
    }
    if (spec.kind === 'camp' && !campPlaced && floorNodes.length) {
      const target = pickRandom(floorNodes) || floorNodes[0];
      if (target) {
        target.type = 'event';
        target.eventId = 'camp';
      }
    }
    if (!floorNodes.length) {
      const fallbackEvent = pickRandom(eventPool) || EVENT_LIBRARY[0];
      floorNodes.push(createNode({ floor: floorIndex, column: 0, type: 'event', eventId: fallbackEvent?.id }));
    }
    floors.push(floorNodes);
  });

  for (let floorIndex = 0; floorIndex < floors.length - 1; floorIndex += 1) {
    const current = floors[floorIndex];
    const next = floors[floorIndex + 1];
    const incoming = new Array(next.length).fill(0);
    current.forEach((node, index) => {
      const neighbors = next.map((_, idx) => idx).filter((idx) => {
        if (next.length <= 2) return true;
        return Math.abs(idx - index) <= 1;
      });
      const linkCount = Math.random() < 0.65 ? 1 : 2;
      const chosen = pickRandomDistinct(neighbors, Math.min(linkCount, neighbors.length));
      node.next = chosen.map((idx) => next[idx].id);
      chosen.forEach((idx) => {
        incoming[idx] += 1;
      });
    });
    next.forEach((node, idx) => {
      if (incoming[idx] > 0) return;
      const source = current.reduce(
        (closest, candidate, candidateIdx) => {
          const distance = Math.abs(candidateIdx - idx);
          if (!closest || distance < closest.distance) {
            return { node: candidate, distance };
          }
          return closest;
        },
        null
      );
      if (source?.node) {
        source.node.next = Array.from(new Set([...(source.node.next || []), node.id]));
      }
    });
  }

  return { floors, nodes };
}

function buildLinearRouteMap(legacyNodes, legacyIndex = 0) {
  if (!legacyNodes.length) {
    return { map: buildRouteMap(), progress: [] };
  }
  const floors = [];
  const nodes = {};
  legacyNodes.forEach((legacy, index) => {
    const node = {
      id: `legacy_${index}`,
      type: legacy.type,
      floor: index,
      column: 0,
      enemyId: legacy.enemyId || null,
      eventId: legacy.eventId || null,
      next: []
    };
    floors.push([node]);
    nodes[node.id] = node;
  });
  floors.forEach((floorNodes, index) => {
    if (index < floors.length - 1) {
      floorNodes[0].next = [floors[index + 1][0].id];
    }
  });
  const progress = [];
  const cappedIndex = Math.min(legacyIndex, floors.length);
  for (let i = 0; i < cappedIndex; i += 1) {
    progress.push(floors[i][0].id);
  }
  return { map: { floors, nodes }, progress };
}

function ensureRouteMap() {
  if (!state.routeMap) {
    state.routeMap = buildRouteMap();
    state.routeProgress = [];
    state.routeCurrent = null;
    state.routeSelection = null;
  }
}

function getRouteNodeById(nodeId) {
  if (!state.routeMap || !nodeId) return null;
  return state.routeMap.nodes?.[nodeId] || null;
}

function getAvailableRouteNodes() {
  ensureRouteMap();
  if (state.routeCurrent) return [];
  if (!state.routeProgress.length) {
    return state.routeMap.floors[0] || [];
  }
  const lastNode = getRouteNodeById(state.routeProgress[state.routeProgress.length - 1]);
  if (!lastNode) return [];
  return (lastNode.next || []).map((id) => getRouteNodeById(id)).filter(Boolean);
}

function setRouteSelection(nodeId) {
  state.routeSelection = nodeId;
  updateRouteUI();
}

function describeRouteNode(node) {
  if (!node) return '—';
  if (node.type === 'battle') {
    const enemy = getEnemyById(node.enemyId);
    return `Бой: ${enemy ? enemy.name : 'Неизвестный враг'}`;
  }
  if (node.type === 'event') {
    const event = EVENT_LIBRARY.find((entry) => entry.id === node.eventId);
    return `Событие: ${event ? event.title : 'Неизвестное событие'}`;
  }
  if (node.type === 'pvp') {
    return 'PvP-вторжение';
  }
  return 'Неизвестный узел';
}

function renderRouteNodes(availableNodes) {
  const container = document.getElementById('routeNodes');
  container.innerHTML = '';
  if (!availableNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Маршрут завершён. Выберите новый забег.';
    container.appendChild(empty);
    return;
  }
  availableNodes.forEach((node) => {
    const button = document.createElement('button');
    button.className = 'route-node';
    button.dataset.nodeId = node.id;
    button.innerHTML = `
      <strong>${describeRouteNode(node)}</strong>
      <span class="route-node-meta">Этаж ${node.floor + 1}</span>
    `;
    button.classList.toggle('selected', node.id === state.routeSelection);
    button.addEventListener('click', () => {
      setRouteSelection(node.id);
    });
    container.appendChild(button);
  });
}

function getRouteNodePosition(map, nodeId) {
  const node = map.nodes?.[nodeId];
  if (!node) return null;
  const floor = map.floors[node.floor] || [];
  const count = floor.length || 1;
  const x = ((node.column + 1) / (count + 1)) * 100;
  const totalFloors = Math.max(map.floors.length - 1, 1);
  const y = (node.floor / totalFloors) * 100;
  return { x, y };
}

function renderRouteMap(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  ensureRouteMap();
  const map = state.routeMap;
  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('route-map-lines');

  const completedSet = new Set(state.routeProgress);
  const availableNodes = getAvailableRouteNodes();
  const availableSet = new Set(availableNodes.map((node) => node.id));

  map.floors.forEach((floor) => {
    floor.forEach((node) => {
      const start = getRouteNodePosition(map, node.id);
      if (!start) return;
      (node.next || []).forEach((nextId) => {
        const end = getRouteNodePosition(map, nextId);
        if (!end) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        const isCompleted = completedSet.has(node.id) && completedSet.has(nextId);
        line.classList.add('route-map-line');
        if (isCompleted) {
          line.classList.add('completed');
        }
        svg.appendChild(line);
      });
    });
  });

  container.appendChild(svg);

  map.floors.forEach((floor) => {
    floor.forEach((node) => {
      const position = getRouteNodePosition(map, node.id);
      if (!position) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'route-map-node';
      button.style.left = `${position.x}%`;
      button.style.top = `${position.y}%`;
      button.textContent = node.type === 'battle' ? '⚔️' : node.type === 'event' ? '✨' : '⚖️';
      button.title = describeRouteNode(node);
      if (completedSet.has(node.id)) {
        button.classList.add('completed');
      }
      if (node.id === state.routeCurrent) {
        button.classList.add('current');
      }
      if (availableSet.has(node.id)) {
        button.classList.add('available');
      }
      if (node.id === state.routeSelection) {
        button.classList.add('selected');
      }
      if (options.interactive && availableSet.has(node.id)) {
        button.addEventListener('click', () => {
          setRouteSelection(node.id);
        });
      } else {
        button.disabled = true;
      }
      container.appendChild(button);
    });
  });
}

function renderRouteMaps() {
  renderRouteMap('routeMap', { interactive: state.screen === 'route' });
  renderRouteMap('battleRouteMap');
  renderRouteMap('eventRouteMap');
}

function formatRunEffects() {
  const effects = [];
  if (state.runEffects.openingBlock) {
    effects.push(`Стартовый блок: +${state.runEffects.openingBlock}`);
  }
  if (state.runEffects.openingStrike) {
    effects.push(`Первый удар: +${state.runEffects.openingStrike} урона`);
  }
  if (!effects.length) {
    return 'Без активных благословений.';
  }
  return effects.join('<br>');
}

function updateRouteUI() {
  document.getElementById('routeRoomCode').textContent = state.roomCode || '—';
  const info = document.getElementById('routeInfo');
  ensureRouteMap();
  state.routeIndex = state.routeProgress.length;
  const totalNodes = state.routeMap.floors.length;
  const availableNodes = getAvailableRouteNodes();
  if (!availableNodes.some((node) => node.id === state.routeSelection)) {
    state.routeSelection = availableNodes[0]?.id || null;
  }
  renderRouteNodes(availableNodes);
  if (state.routeProgress.length >= totalNodes) {
    info.textContent = 'Маршрут завершён. Можно начать заново или заняться PvP.';
  } else {
    const progress = Math.min(state.routeProgress.length + 1, totalNodes);
    info.textContent = `Текущий прогресс: узел ${progress} из ${totalNodes}.`;
  }
  const nextLabel = document.getElementById('routeNextLabel');
  if (nextLabel) {
    if (state.routeProgress.length >= totalNodes) {
      nextLabel.textContent = 'Маршрут завершён.';
    } else if (state.routeSelection) {
      nextLabel.textContent = describeRouteNode(getRouteNodeById(state.routeSelection));
    } else {
      nextLabel.textContent = 'Выберите следующий узел на карте.';
    }
  }
  const nextButton = document.getElementById('btnRouteNext');
  if (nextButton) {
    nextButton.disabled = state.routeProgress.length >= totalNodes || !state.routeSelection;
  }
  const status = document.getElementById('routeStatus');
  if (status) {
    status.innerHTML = `
      <div>Герой: <strong>${state.heroId ? HEROES[state.heroId].name : '—'}</strong></div>
      <div>HP: <strong>${state.heroHp} / ${state.heroMaxHp}</strong></div>
      <div>Колода: <strong>${state.deck.length}</strong> карт</div>
      <div class="muted">${formatRunEffects()}</div>
    `;
  }
  renderRouteMaps();
}

// WebSocket ---------------------------------------------------------------
function connectSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  setWsStatus('подключение...');
  socket = new WebSocket(WS_URL);
  socket.addEventListener('open', () => {
    setWsStatus('онлайн');
    setFooterMessage('Подключено к серверу.');
    socket.send(JSON.stringify({ type: 'HELLO' }));
  });
  socket.addEventListener('close', () => {
    setWsStatus('офлайн');
    setFooterMessage('Соединение потеряно. Попытка переподключения...');
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectSocket, 2000);
  });
  socket.addEventListener('error', () => {
    setWsStatus('ошибка');
  });
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  });
}

function sendToServer(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    logDebug('Socket not ready, skipping send', payload);
    return;
  }
  socket.send(JSON.stringify(payload));
}

function sendWhenReady(payload) {
  if (!socket) return;
  if (socket.readyState === WebSocket.OPEN) {
    sendToServer(payload);
  } else {
    const handler = () => {
      sendToServer(payload);
    };
    socket.addEventListener('open', handler, { once: true });
  }
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case 'HELLO_ACK':
      logDebug('Server says hello');
      break;
    case 'ROOM_CREATED':
      state.roomCode = msg.roomCode;
      savePersistentState();
      setFooterMessage(`Комната создана: ${msg.roomCode}`);
      updateRouteUI();
      updateRoomIndicator();
      break;
    case 'JOINED':
      state.pvp.role = msg.role;
      state.roomCode = msg.roomCode;
      if (msg.role === 'host') {
        storageSet(STORAGE_KEYS.room, state.roomCode);
      }
      setFooterMessage(`Вы подключены как ${msg.role === 'host' ? 'хост' : 'гость'} (${msg.roomCode})`);
      if (msg.role === 'guest') {
        document.getElementById('joinStatus').textContent = `Подключено к комнате ${msg.roomCode}. Ожидаем хоста.`;
        showScreen('start');
      }
      updateRouteUI();
      updateRoomIndicator();
      syncPlayerStatus();
      break;
    case 'GUEST_JOINED':
      setFooterMessage('Гость подключился. Можно переходить к PvP.');
      break;
    case 'PVP_WAITING_GUEST':
      setFooterMessage('Ожидание соперника...');
      break;
    case 'PVP_TIMEOUT':
      if (state.battle && state.battle.mode === 'pvp' && state.battle.status === 'waiting') {
        state.battle.timeoutReached = true;
        updateBattleStatus('Ожидание соперника истекло. Можно начать тренировочный бой.');
      }
      break;
    case 'PVP_START':
      startPvpBattle();
      break;
    case 'OPPONENT_READY':
      state.pvp.opponentReady = msg.ready;
      updateBattleStatus(`Соперник ${msg.ready ? 'готов' : 'снимает готовность'}.`);
      break;
    case 'OPPONENT_SLOTS':
      state.pvp.opponentSlots = (msg.slots || [null, null, null]).map((cardId) => (cardId ? String(cardId) : null));
      renderOpponentSlots();
      break;
    case 'PVP_REVEAL':
      if (state.battle && state.battle.mode === 'pvp') {
        resolveRound();
      }
      break;
    case 'ERROR':
      setFooterMessage(`Ошибка: ${msg.message}`);
      updateBattleStatus(`Ошибка: ${msg.message}`);
      break;
    case 'PLAYER_DIRECTORY':
      state.playerDirectory = Array.isArray(msg.players) ? msg.players : [];
      renderPlayerDirectory();
      break;
    default:
      logDebug('Unhandled server message', msg);
  }
}

// Route + hero selection --------------------------------------------------
function setupHeroSelection() {
  const form = document.getElementById('heroForm');
  form.hero.value = state.heroId || '';
}

function startNewGame() {
  resetRun();
  connectSocket();
  sendWhenReady({ type: 'CREATE_ROOM' });
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setFooterMessage('Создание комнаты произойдёт после подключения.');
  }
  setupHeroSelection();
  showScreen('hero');
}

function continueGame() {
  if (!state.heroId || state.deck.length === 0) {
    setFooterMessage('Нет сохранённого приключения.');
    return;
  }
  ensureRouteMap();
  state.heroHp = state.heroHp || HEROES[state.heroId].hp;
  state.heroMaxHp = HEROES[state.heroId].hp;
  showScreen('route');
  updateRouteUI();
}

function finalizeHeroSelection() {
  const selected = document.querySelector('input[name="hero"]:checked');
  if (!selected) {
    setFooterMessage('Выберите героя.');
    return;
  }
  const heroId = selected.value;
  const hero = HEROES[heroId];
  state.heroId = heroId;
  state.heroHp = hero.hp;
  state.heroMaxHp = hero.hp;
  state.deck = hero.deck.map(createCardInstance);
  state.routeIndex = 0;
  state.routeMap = buildRouteMap();
  state.routeProgress = [];
  state.routeCurrent = null;
  state.routeSelection = null;
  state.runEffects = { openingBlock: 0, openingStrike: 0 };
  savePersistentState();
  document.getElementById('btnContinue').disabled = false;
  showScreen('route');
  updateRouteUI();
}

// Event helpers -----------------------------------------------------------
function adjustHeroHp(amount) {
  state.heroHp = Math.max(0, Math.min(state.heroMaxHp, state.heroHp + amount));
  savePersistentState();
}

function addRunEffect(key, amount) {
  state.runEffects[key] = (state.runEffects[key] || 0) + amount;
  savePersistentState();
}

function removeRandomCard() {
  if (!state.deck.length) return null;
  const index = Math.floor(Math.random() * state.deck.length);
  const [removed] = state.deck.splice(index, 1);
  savePersistentState();
  return removed;
}

function addRandomCardByRarity(rarity) {
  const candidates = Object.values(CARD_LIBRARY).filter((card) => card.rarity === rarity);
  const pick = pickRandom(candidates);
  if (!pick) return null;
  addCardToDeck(pick.id);
  return pick;
}

const EVENT_LIBRARY = [
  {
    id: 'mirror_fountain',
    title: 'Зеркальный источник',
    description: 'Сияющая вода обещает восстановление или усиление.',
    buildOptions() {
      return [
        {
          text: 'Вы пьёте воду и чувствуете прилив сил.',
          button: '+4 HP',
          action: () => {
            adjustHeroHp(4);
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Сияние превращается в новую карту.',
          button: 'Получить «Зеркальная метка»',
          action: () => {
            addCardToDeck('brand');
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Отражение оставляет защитный символ.',
          button: 'Благословение: +1 блок в первом раунде',
          action: () => {
            addRunEffect('openingBlock', 1);
            updateRouteAfterEvent();
          }
        }
      ];
    }
  },
  {
    id: 'shard_market',
    title: 'Рынок осколков',
    description: 'Купцы меняют карты на редкие отголоски.',
    buildOptions() {
      return [
        {
          text: 'Вы обмениваете случайную карту на редкий отголосок.',
          button: 'Обменять карту',
          action: () => {
            const removed = removeRandomCard();
            if (removed) {
              addRandomCardByRarity('rare');
              setFooterMessage(`Обмен: ${CARD_LIBRARY[removed.cardId]?.name || 'карта'} → редкая.`);
            }
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Тихий купец укрепляет вашу руку.',
          button: '+1 к урону первого удара',
          action: () => {
            addRunEffect('openingStrike', 1);
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Выбираете безопасный вариант.',
          button: '+2 HP',
          action: () => {
            adjustHeroHp(2);
            updateRouteAfterEvent();
          }
        }
      ];
    }
  },
  {
    id: 'echo_ritual',
    title: 'Ритуал отголосков',
    description: 'Шёпот просит принести жертву ради силы.',
    buildOptions() {
      return [
        {
          text: 'Вы принимаете благословение ритма.',
          button: 'Получить «Вспышка Ритма»',
          action: () => {
            addCardToDeck('flash');
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Пульс энергии остаётся в руках.',
          button: '+1 к урону первого удара',
          action: () => {
            addRunEffect('openingStrike', 1);
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Вы отказываетесь и берёте немного отдыха.',
          button: '+3 HP',
          action: () => {
            adjustHeroHp(3);
            updateRouteAfterEvent();
          }
        }
      ];
    }
  },
  {
    id: 'camp',
    title: 'Лагерь зеркальщиков',
    description: 'Перед финалом можно перевести дух или усилить колоду.',
    buildOptions() {
      return [
        {
          text: 'Сияющий луч восполняет здоровье.',
          button: '+4 HP',
          action: () => {
            adjustHeroHp(4);
            updateRouteAfterEvent();
          }
        },
        {
          text: 'Зеркальная тренировка открывает новую карту.',
          button: 'Получить «Искра Фокусировки»',
          action: () => {
            addCardToDeck('surge');
            updateRouteAfterEvent();
          }
        },
        {
          text: 'В тайнике нашли редкие карты.',
          button: 'Выбрать карту',
          action: () => {
            openLootEvent();
          }
        }
      ];
    }
  }
];

function openEvent(title, description, options) {
  document.getElementById('eventTitle').textContent = title;
  document.getElementById('eventDescription').textContent = description;
  const container = document.getElementById('eventOptions');
  container.innerHTML = '';
  options.forEach((opt) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    const text = document.createElement('p');
    text.textContent = opt.text;
    const btn = document.createElement('button');
    btn.className = 'primary';
    btn.textContent = opt.button;
    btn.addEventListener('click', () => {
      opt.action();
    });
    card.appendChild(text);
    card.appendChild(btn);
    container.appendChild(card);
  });
  showScreen('event');
  renderRouteMaps();
}

function openEventById(eventId) {
  const event = EVENT_LIBRARY.find((entry) => entry.id === eventId);
  if (!event) {
    setFooterMessage('Событие не найдено.');
    return;
  }
  openEvent(event.title, event.description, event.buildOptions());
}

function closeEvent(options = {}) {
  const { keepRouteCurrent = false } = options;
  if (!keepRouteCurrent && state.routeCurrent && !state.routeProgress.includes(state.routeCurrent)) {
    state.routeCurrent = null;
    state.routeSelection = null;
    savePersistentState();
  }
  showScreen('route');
  updateRouteUI();
}

// Deck management ---------------------------------------------------------
function addCardToDeck(cardId) {
  const inst = createCardInstance(cardId);
  state.deck.push(inst);
  savePersistentState();
  setFooterMessage(`Получена карта: ${CARD_LIBRARY[cardId].name}`);
}

// Battle management -------------------------------------------------------
function startPveBattle(enemyId, context = 'campaign') {
  const profile = getEnemyById(enemyId);
  if (!profile) {
    setFooterMessage('Враг не найден.');
    return;
  }
  const opponent = {
    name: profile.name,
    hp: profile.hp,
    maxHp: profile.hp,
    slots: [null, null, null],
    profileId: profile.id
  };
  state.battle = {
    mode: enemyId,
    opponent,
    player: {
      name: HEROES[state.heroId].name,
      hp: state.heroHp,
      maxHp: state.heroMaxHp,
      slots: [null, null, null]
    },
    round: 1,
    activeSide: 'player',
    log: [],
    temp: null,
    status: 'playing',
    nextRoundActive: null,
    timeoutReached: false,
    context
  };
  document.getElementById('battleLog').textContent = '';
  prepareNewRound();
  showScreen('battle');
  renderBattle();
  updateBattleStatus('Разместите карты и нажмите «Подтвердить расклад».');
}

function startPracticeBattle() {
  if (!state.heroId) {
    state.heroId = 'mage';
    state.heroHp = HEROES.mage.hp;
    state.heroMaxHp = HEROES.mage.hp;
    state.deck = HEROES.mage.deck.map(createCardInstance);
  }
  const foe = getEnemyByTier(1) || ENEMY_DB.enemies[0];
  if (foe) {
    startPveBattle(foe.id, 'practice');
  }
}

function startPvpBattle() {
  if (!state.heroId) {
    state.heroId = 'mage';
    state.heroHp = HEROES.mage.hp;
    state.heroMaxHp = HEROES.mage.hp;
    state.deck = HEROES.mage.deck.map(createCardInstance);
    setFooterMessage('Вы участвуете как Маг по умолчанию.');
  }
  const opponent = {
    name: state.pvp.role === 'host' ? 'Гость' : 'Хост',
    hp: state.heroMaxHp,
    maxHp: state.heroMaxHp,
    slots: [null, null, null]
  };
  state.battle = {
    mode: 'pvp',
    opponent,
    player: {
      name: HEROES[state.heroId].name,
      hp: state.heroHp,
      maxHp: state.heroMaxHp,
      slots: [null, null, null]
    },
    round: 1,
    activeSide: 'player',
    log: [],
    temp: null,
    status: 'playing',
    nextRoundActive: null,
    timeoutReached: false,
    context: 'campaign'
  };
  document.getElementById('battleLog').textContent = '';
  prepareNewRound();
  showScreen('battle');
  renderBattle();
  updateBattleStatus('PvP бой начался! Разместите карты и нажмите «Подтвердить».');
}

function prepareNewRound() {
  const battle = state.battle;
  battle.temp = {
    player: {
      block: 0,
      reflect: 0,
      nextPriority: false,
      slotOrder: [0, 1, 2],
      damageMod: 0,
      marked: false,
      strikeBonus: state.runEffects.openingStrike || 0
    },
    opponent: {
      block: 0,
      reflect: 0,
      nextPriority: false,
      slotOrder: [0, 1, 2],
      damageMod: 0,
      marked: false,
      strikeBonus: 0
    }
  };
  if (battle.round === 1 && state.runEffects.openingBlock) {
    battle.temp.player.block += state.runEffects.openingBlock;
    updateBattleLog(`Благословение: стартовый блок +${state.runEffects.openingBlock}.`);
  }
  if (battle.mode !== 'pvp') {
    battle.opponent.slots = generateEnemySlots(battle);
  } else {
    state.pvp.ready = false;
    state.pvp.opponentReady = false;
  }
  battle.player.slots = [null, null, null];
  state.pvp.opponentSlots = [null, null, null];
  renderOpponentSlots();
  renderPlayerSlots();
  renderCardPool();
  updateBattleLog(`--- Раунд ${battle.round} ---`);
}

function generateEnemySlots(battle) {
  const enemy = getEnemyById(battle.opponent.profileId);
  if (!enemy) return [null, null, null];
  const pattern = selectEnemyPattern(enemy, battle);
  return pattern.map((cardId) => createEnemyCardFromId(cardId));
}

function renderBattle() {
  const playerHpFill = document.getElementById('playerHpFill');
  const opponentHpFill = document.getElementById('opponentHpFill');
  const playerHpText = document.getElementById('playerHpText');
  const opponentHpText = document.getElementById('opponentHpText');
  const opponentName = document.getElementById('opponentName');
  const battle = state.battle;
  playerHpText.textContent = `${Math.max(0, battle.player.hp)} / ${battle.player.maxHp}`;
  opponentHpText.textContent = `${Math.max(0, battle.opponent.hp)} / ${battle.opponent.maxHp}`;
  playerHpFill.style.width = `${Math.max(0, (battle.player.hp / battle.player.maxHp) * 100)}%`;
  opponentHpFill.style.width = `${Math.max(0, (battle.opponent.hp / battle.opponent.maxHp) * 100)}%`;
  if (opponentName) {
    opponentName.textContent = battle.opponent.name || '—';
  }
  renderPlayerSlots();
  renderOpponentSlots();
  renderCardPool();
  renderRouteMaps();
}

function renderPlayerSlots() {
  const container = document.getElementById('playerSlots');
  container.innerHTML = '';
  const slots = state.battle.player.slots;
  slots.forEach((instance, idx) => {
    container.appendChild(createSlotElement('player', idx, instance));
  });
}

function renderOpponentSlots() {
  const container = document.getElementById('opponentSlots');
  container.innerHTML = '';
  const battle = state.battle;
  let slots;
  if (battle.mode === 'pvp') {
    slots = state.pvp.opponentSlots.map((cardId) => {
      if (!cardId) return null;
      const def = CARD_LIBRARY[cardId];
      return def
        ? { emoji: def.emoji, name: '???', type: def.type }
        : { emoji: '❔', name: '???', type: 'unknown' };
    });
  } else {
    slots = battle.opponent.slots;
  }
  slots.forEach((card, idx) => {
    container.appendChild(createSlotElement('opponent', idx, card));
  });
}

function createSlotElement(side, slotIndex, cardData) {
  const div = document.createElement('div');
  div.className = `slot ${side}`;
  const idxLabel = document.createElement('span');
  idxLabel.className = 'slot-index';
  idxLabel.textContent = slotIndex + 1;
  div.appendChild(idxLabel);
  const emoji = document.createElement('div');
  emoji.className = 'slot-card-type';
  const name = document.createElement('div');
  name.className = 'slot-card-name';

  if (side === 'player') {
    if (cardData) {
      const def = cardDefinitionForInstance(cardData);
      emoji.textContent = def.emoji;
      name.textContent = def.name;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'clear-slot';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        clearPlayerSlot(slotIndex);
      });
      div.appendChild(removeBtn);
    } else {
      emoji.textContent = '•';
      name.textContent = 'Пусто';
    }
  } else {
    if (cardData) {
      const type = battleCardType(cardData);
      emoji.textContent = type.emoji;
      name.textContent = type.title;
    } else {
      emoji.textContent = '•';
      name.textContent = 'Ожидание';
    }
  }
  div.appendChild(emoji);
  div.appendChild(name);
  return div;
}

function battleCardType(card) {
  if (!card) return { emoji: '•', title: 'Пусто' };
  if (card.instanceId) {
    const def = cardDefinitionForInstance(card);
    return { emoji: def.emoji, title: def.name };
  }
  if (card.cardId && CARD_LIBRARY[card.cardId]) {
    const def = CARD_LIBRARY[card.cardId];
    return { emoji: def.emoji, title: def.name };
  }
  if (card.name === '???') {
    return { emoji: card.emoji || '❔', title: '???' };
  }
  return { emoji: card.emoji || '•', title: card.type === 'attack' ? '🥊' : card.type === 'defense' ? '🛡️' : '✨' };
}

function renderCardPool() {
  const container = document.getElementById('cardPool');
  container.innerHTML = '';
  state.deck.forEach((inst) => {
    if (inst.burned) return;
    const cardDef = cardDefinitionForInstance(inst);
    const button = document.createElement('button');
    button.className = 'card-button';
    button.dataset.rarity = cardDef.rarity;
    if (inst.inUse) {
      button.dataset.state = 'locked';
    }
    button.innerHTML = `<span class="emoji">${cardDef.emoji}</span><span>${cardDef.name}</span>`;
    button.addEventListener('click', () => openCardInfo(inst.instanceId));
    container.appendChild(button);
  });
}

function assignCardToSlot(instanceId) {
  const battle = state.battle;
  const instance = findCardInstance(instanceId);
  if (!instance || instance.inUse) return false;
  if (state.battle.mode === 'pvp' && state.pvp.ready) {
    setPvpReady(false);
  }
  const nextSlot = battle.player.slots.findIndex((slot) => slot === null);
  if (nextSlot === -1) {
    updateBattleStatus('Все три слота заняты. Очистите слот для замены.');
    return false;
  }
  battle.player.slots[nextSlot] = instance;
  instance.inUse = true;
  renderPlayerSlots();
  renderCardPool();
  return true;
}

function clearPlayerSlot(index) {
  const battle = state.battle;
  const inst = battle.player.slots[index];
  if (inst) {
    inst.inUse = false;
    battle.player.slots[index] = null;
    if (state.battle.mode === 'pvp' && state.pvp.ready) {
      setPvpReady(false);
    }
    renderPlayerSlots();
    renderCardPool();
  }
}

function resetPlayerSlots() {
  state.battle.player.slots.forEach((inst, idx) => {
    if (inst) {
      inst.inUse = false;
      state.battle.player.slots[idx] = null;
    }
  });
  if (state.battle.mode === 'pvp' && state.pvp.ready) {
    setPvpReady(false);
  }
  renderPlayerSlots();
  renderCardPool();
}

function updateBattleStatus(msg) {
  const status = document.getElementById('battleStatus');
  status.textContent = msg;
}

function updateBattleLog(line) {
  const logEl = document.getElementById('battleLog');
  logEl.textContent += `${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function confirmBattleSlots() {
  const slots = state.battle.player.slots;
  if (slots.every((slot) => slot === null)) {
    updateBattleStatus('Нужно выложить хотя бы одну карту.');
    return;
  }
  if (state.battle.mode === 'pvp') {
    const payload = slots.map((inst) => (inst ? inst.cardId : null));
    sendToServer({ type: 'SET_SLOTS', roomCode: state.roomCode, slots: payload });
    setPvpReady(true);
    updateBattleStatus('Ожидание соперника...');
  } else {
    resolveRound();
  }
}

function setPvpReady(ready) {
  if (!state.battle || state.battle.mode !== 'pvp') return;
  if (state.pvp.ready === ready) return;
  state.pvp.ready = ready;
  sendToServer({ type: 'SET_READY', roomCode: state.roomCode, ready });
}

function resolveRound() {
  const battle = state.battle;
  if (battle.mode === 'pvp') {
    battle.opponent.slots = state.pvp.opponentSlots.map((cardId) => {
      if (!cardId) return null;
      const def = CARD_LIBRARY[cardId];
      return def ? { ...def, cardId } : null;
    });
  }
  battle.temp.player.block = 0;
  battle.temp.player.reflect = 0;
  battle.temp.player.nextPriority = battle.temp.player.nextPriority || false;
  battle.temp.opponent.block = 0;
  battle.temp.opponent.reflect = 0;
  const active = battle.activeSide;
  const passive = active === 'player' ? 'opponent' : 'player';
  updateBattleLog(`Активная сторона: ${active === 'player' ? 'Игрок' : 'Оппонент'}`);

  for (let step = 0; step < 3; step += 1) {
    const order = determineStepOrder(step);
    for (const side of order) {
      if (battle.status === 'finished') break;
      const slotIndex = getSlotIndexForSide(side, step);
      const card = getCardAtSlot(side, slotIndex);
      if (!card) {
        updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} — слот ${slotIndex + 1}: пусто.`);
        continue;
      }
      revealSlot(side, slotIndex, card);
      const finished = applyCardEffect(side, card, step);
      if (finished) break;
    }
    battle.temp.player.block = 0;
    battle.temp.player.reflect = 0;
    battle.temp.opponent.block = 0;
    battle.temp.opponent.reflect = 0;
    if (battle.status === 'finished') break;
  }

  if (battle.status !== 'finished') {
    concludeRound();
  }
}

function determineStepOrder(step) {
  const battle = state.battle;
  const priority = [];
  if (battle.temp.player.nextPriority) priority.push('player');
  if (battle.temp.opponent.nextPriority) priority.push('opponent');
  let first;
  if (priority.length === 1) {
    first = priority[0];
  } else if (priority.length === 2) {
    first = battle.activeSide;
  } else {
    first = battle.activeSide;
  }
  if (priority.includes('player')) battle.temp.player.nextPriority = false;
  if (priority.includes('opponent')) battle.temp.opponent.nextPriority = false;
  const second = first === 'player' ? 'opponent' : 'player';
  return [first, second];
}

function getSlotIndexForSide(side, logicalIndex) {
  const battle = state.battle;
  return battle.temp[side].slotOrder[logicalIndex] ?? logicalIndex;
}

function getCardAtSlot(side, slotIndex) {
  if (side === 'player') {
    return state.battle.player.slots[slotIndex];
  }
  if (state.battle.mode === 'pvp') {
    const cardId = state.pvp.opponentSlots[slotIndex];
    if (!cardId) return null;
    const def = CARD_LIBRARY[cardId];
    if (!def) {
      return { id: cardId, name: 'Неизвестная карта', type: 'attack', emoji: '❔', baseDamage: 0 };
    }
    return { ...def, cardId };
  }
  return state.battle.opponent.slots[slotIndex];
}

function revealSlot(side, slotIndex, card) {
  const who = side === 'player' ? 'Игрок' : 'Оппонент';
  let name;
  if (card.instanceId) {
    const def = cardDefinitionForInstance(card);
    name = def.name;
  } else if (card.cardId && CARD_LIBRARY[card.cardId]) {
    name = CARD_LIBRARY[card.cardId].name;
  } else {
    name = card.name;
  }
  const container = document.getElementById(side === 'player' ? 'playerSlots' : 'opponentSlots');
  const slotEl = container ? container.children[slotIndex] : null;
  if (slotEl) {
    const emojiEl = slotEl.querySelector('.slot-card-type');
    const nameEl = slotEl.querySelector('.slot-card-name');
    if (emojiEl) {
      const typeInfo = battleCardType(card);
      emojiEl.textContent = typeInfo.emoji;
    }
    if (nameEl) {
      nameEl.textContent = name;
    }
  }
  updateBattleLog(`${who} раскрывает слот ${slotIndex + 1}: ${name}.`);
}

function applyCardEffect(side, card, step) {
  const battle = state.battle;
  const def = card.instanceId ? cardDefinitionForInstance(card) : card.cardId ? CARD_LIBRARY[card.cardId] : card;
  const actor = side;
  const target = side === 'player' ? 'opponent' : 'player';
  const actorState = battle.temp[actor];
  const targetState = battle.temp[target];

  switch (def.type) {
    case 'attack': {
      const base = def.baseDamage || 0;
      let total = Math.max(0, base + actorState.damageMod);
      if (actor === 'player' && actorState.strikeBonus) {
        total += actorState.strikeBonus;
        updateBattleLog(`Первый удар усиливается на ${actorState.strikeBonus}.`);
        actorState.strikeBonus = 0;
      }
      if (targetState.marked) {
        total += 2;
        targetState.marked = false;
        updateBattleLog('Метка срабатывает: +2 урона.');
      }
      let damage = 0;
      if (def.effect === 'execute') {
        damage = attemptExecute(side, target);
      } else if (def.effect === 'pierce') {
        applyDirectDamage(target, total);
        damage = total;
        updateBattleLog('Пронзающий удар игнорирует блок.');
      } else {
        if (def.effect === 'break') {
          const breakAmount = def.breakAmount || 2;
          targetState.block = Math.max(0, targetState.block - breakAmount);
          updateBattleLog(`Блок цели ослаблен на ${breakAmount}.`);
        }
        damage = applyDamage(target, total, side);
      }
      if (def.apply === 'frost') {
        targetState.damageMod -= 1;
        updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} охлаждает цель: -1 к урону до конца раунда.`);
      }
      if (def.effect === 'execute' && damage === 'executed') {
        updateBattleLog('Клинок Судьбы завершает бой!');
      }
      if (def.effect === 'burn' && damage !== 'executed' && battle[target].hp > 0) {
        applyDirectDamage(target, 1);
        updateBattleLog('Ожог наносит 1 прямого урона.');
      }
      if (def.effect === 'doubleHit' && damage !== 'executed' && battle[target].hp > 0) {
        applyDamage(target, total, side);
        updateBattleLog('Разлом Потока наносит повторный удар!');
      }
      if (def.effect === 'drain' && damage && damage !== 'executed') {
        const heal = Math.ceil((damage || 0) * (def.healRatio || 0.5));
        battle[actor].hp = Math.min(battle[actor].maxHp, battle[actor].hp + heal);
        updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} высасывает ${heal} HP.`);
      }
      markCardUsage(card);
      break;
    }
    case 'defense': {
      actorState.block = def.block || 0;
      actorState.reflect = def.reflect || 0;
      updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} ставит блок ${actorState.block}${actorState.reflect ? ` и ответку ${actorState.reflect}` : ''}.`);
      markCardUsage(card);
      break;
    }
    case 'spell': {
      switch (def.effect) {
        case 'priority':
          actorState.nextPriority = true;
          updateBattleLog('Следующая карта этого игрока пойдёт первой.');
          break;
        case 'reverse':
          targetState.slotOrder = [2, 1, 0];
          updateBattleLog('Порядок слотов соперника инвертирован!');
          break;
        case 'wrath':
          applyDamage(target, Math.max(0, (def.baseDamage || 0) + actorState.damageMod), side);
          battle.nextRoundActive = side;
          updateBattleLog('Гнев Двух Стихий: вы будете первыми в следующем раунде.');
          break;
        case 'mark':
          targetState.marked = true;
          updateBattleLog('Цель помечена: следующий удар усилен.');
          break;
        case 'reduceOpponent':
          targetState.damageMod -= 1;
          updateBattleLog('Оппонент теряет 1 урона до конца раунда.');
          break;
        case 'empower':
          actorState.damageMod += 1;
          updateBattleLog('Сила накапливается: +1 к урону до конца раунда.');
          break;
        case 'cleanse': {
          const blockGain = def.block || 0;
          actorState.damageMod = Math.max(0, actorState.damageMod);
          if (blockGain) {
            actorState.block = (actorState.block || 0) + blockGain;
          }
          updateBattleLog(`Отражение рассеивает штрафы${blockGain ? ` и даёт блок ${blockGain}.` : '.'}`);
          break;
        }
        case 'none':
          updateBattleLog('Пасс.');
          break;
        default:
          if (def.heal) {
            const healed = Math.min(def.heal, battle[actor].maxHp - battle[actor].hp);
            battle[actor].hp += healed;
            updateBattleLog(`${actor === 'player' ? 'Игрок' : 'Оппонент'} лечит ${healed} HP.`);
          }
      }
      if (def.baseDamage && def.effect !== 'wrath') {
        applyDamage(target, Math.max(0, def.baseDamage + actorState.damageMod), side);
      }
      markCardUsage(card);
      break;
    }
    default:
      updateBattleLog('Карта не распознана.');
      break;
  }

  return checkVictoryState();
}

function markCardUsage(card) {
  if (card && card.instanceId) {
    card.wasPlayed = true;
  }
}

function attemptExecute(actorSide, targetSide) {
  const battle = state.battle;
  const target = battle[targetSide];
  if (target.hp <= target.maxHp / 2) {
    target.hp = 0;
    return 'executed';
  }
  const actorState = battle.temp[actorSide];
  const damage = Math.max(0, 4 + actorState.damageMod);
  applyDamage(targetSide, damage, actorSide);
  return damage;
}

function applyDamage(targetSide, amount, sourceSide) {
  if (amount <= 0) return 0;
  const battle = state.battle;
  const targetState = battle.temp[targetSide];
  let damage = amount;
  if (targetState.block > 0) {
    const absorbed = Math.min(targetState.block, damage);
    targetState.block -= absorbed;
    damage -= absorbed;
    if (absorbed > 0) {
      updateBattleLog(`${targetSide === 'player' ? 'Игрок' : 'Оппонент'} блокирует ${absorbed} урона.`);
      if (sourceSide && targetState.reflect > 0) {
        applyDirectDamage(sourceSide, targetState.reflect);
        updateBattleLog(`Ответный урон ${targetState.reflect}!`);
      }
    }
  }
  if (damage > 0) {
    battle[targetSide].hp = Math.max(0, battle[targetSide].hp - damage);
    updateBattleLog(`${targetSide === 'player' ? 'Игрок' : 'Оппонент'} получает ${damage} урона.`);
  }
  return damage;
}

function applyDirectDamage(side, amount) {
  if (amount <= 0) return;
  const battle = state.battle;
  battle[side].hp = Math.max(0, battle[side].hp - amount);
}

function concludeRound() {
  const battle = state.battle;
  battle.round += 1;
  if (battle.nextRoundActive) {
    battle.activeSide = battle.nextRoundActive;
    battle.nextRoundActive = null;
  } else {
    battle.activeSide = battle.activeSide === 'player' ? 'opponent' : 'player';
  }

  state.deck = state.deck.filter((inst) => {
    if (inst.wasPlayed && inst.once) {
      inst.burned = true;
      return false;
    }
    inst.inUse = false;
    inst.wasPlayed = false;
    return true;
  });
  battle.player.slots = [null, null, null];
  renderCardPool();
  renderPlayerSlots();
  renderBattle();
  savePersistentState();

  if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
    finishBattle();
  } else {
    prepareNewRound();
  }
}

function checkVictoryState() {
  const battle = state.battle;
  if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
    finishBattle();
    return true;
  }
  return false;
}

function finishBattle() {
  const battle = state.battle;
  if (!battle || battle.status === 'finished') return;
  battle.status = 'finished';
  const playerWon = battle.player.hp > 0 && battle.opponent.hp <= 0;
  const opponentWon = battle.opponent.hp > 0 && battle.player.hp <= 0;
  const resultTitle = document.getElementById('resultTitle');
  const resultSummary = document.getElementById('resultSummary');
  if (playerWon) {
    resultTitle.textContent = 'Победа!';
    resultSummary.textContent = 'Вы разгромили соперника.';
    state.heroHp = battle.player.hp;
    if (battle.context === 'campaign') {
      advanceRoute();
    }
  } else if (opponentWon) {
    resultTitle.textContent = 'Поражение…';
    resultSummary.textContent = 'Попробуйте ещё раз.';
  } else {
    resultTitle.textContent = 'Ничья';
    resultSummary.textContent = 'Оба бойца пали.';
  }
  showScreen('result');
}

function repeatBattle() {
  if (!state.battle) return;
  if (state.battle.mode === 'pvp') {
    startPvpBattle();
  } else {
    startPveBattle(state.battle.mode);
  }
}

// Route node handlers -----------------------------------------------------
function handleRouteNode(nodeId) {
  const node = getRouteNodeById(nodeId);
  const availableNodes = getAvailableRouteNodes();
  const isAvailable = availableNodes.some((entry) => entry.id === nodeId);
  if (!node || !isAvailable) {
    setFooterMessage('Выберите доступный узел маршрута.');
    return;
  }
  state.routeCurrent = node.id;
  state.routeSelection = node.id;
  savePersistentState();
  switch (node.type) {
    case 'battle':
      startPveBattle(node.enemyId, 'campaign');
      break;
    case 'event':
      openEventById(node.eventId);
      break;
    case 'pvp':
      openPvpEvent();
      break;
    default:
      break;
  }
}

function openPvpEvent() {
  openEvent(
    'Разлом зеркала',
    'В расщелине мерцают силуэты других игроков. Войти в PvP или отразить фантом?',
    [
      {
        text: 'Настоящее вторжение через зеркало.',
        button: 'Войти в PvP',
        action: () => {
          closeEvent({ keepRouteCurrent: true });
          startPvPNode();
        }
      },
      {
        text: 'Если нет соперника, можно сразиться с отражением.',
        button: 'Сразиться с фантомом',
        action: () => {
          closeEvent({ keepRouteCurrent: true });
          const foe = getEnemyByTier(2) || ENEMY_DB.enemies[0];
          if (foe) {
            startPveBattle(foe.id, 'campaign');
          }
        }
      }
    ]
  );
}

function openLootEvent() {
  const lootCards = ['flame', 'power', 'disrupt', 'rupture', 'fate', 'wrath', 'flash', 'shield', 'aegis', 'veil', 'ember', 'brand'];
  const shuffled = lootCards.sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, 3).map((cardId) => {
    const card = CARD_LIBRARY[cardId];
    return {
      text: `${card.emoji} ${card.name} (${card.rarity === 'common' ? 'обычная' : card.rarity === 'rare' ? 'редкая' : 'легендарная'})${card.once ? ' — сгорает' : ''}`,
      button: 'Забрать',
      action: () => {
        addCardToDeck(cardId);
        updateRouteAfterEvent();
      }
    };
  });
  openEvent('Найден лут!', 'Выберите одну карту. Редкие и легендарные сгорают после использования.', options);
}

function updateRouteAfterEvent() {
  closeEvent({ keepRouteCurrent: true });
  advanceRoute();
}

function advanceRoute() {
  if (!state.routeCurrent) return;
  if (!state.routeProgress.includes(state.routeCurrent)) {
    state.routeProgress.push(state.routeCurrent);
  }
  state.routeIndex = state.routeProgress.length;
  state.routeCurrent = null;
  state.routeSelection = null;
  savePersistentState();
  updateRouteUI();
}

function startPvPNode() {
  showScreen('battle');
  updateBattleStatus('Подготовка PvP.');
  if (state.pvp.role === 'guest') {
    updateBattleStatus('Ожидаем хоста для начала PvP.');
    return;
  }
  sendToServer({ type: 'PVP_READY', roomCode: state.roomCode });
  state.battle = {
    mode: 'pvp',
    status: 'waiting',
    opponent: { name: 'Гость', hp: state.heroMaxHp, maxHp: state.heroMaxHp, slots: [null, null, null] },
    player: { name: HEROES[state.heroId].name, hp: state.heroHp, maxHp: state.heroMaxHp, slots: [null, null, null] },
    round: 1,
    activeSide: 'player',
    log: [],
    temp: null,
    nextRoundActive: null,
    timeoutReached: false,
    context: 'campaign'
  };
  document.getElementById('battleLog').textContent = 'Ожидание соперника...\n';
  renderBattle();
}

// Join screen -------------------------------------------------------------
function joinRoom() {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  if (code.length !== 6) {
    document.getElementById('joinStatus').textContent = 'Введите 6 символов.';
    return;
  }
  connectSocket();
  sendWhenReady({ type: 'JOIN_ROOM', roomCode: code });
}

// Button bindings ---------------------------------------------------------
function setupButtons() {
  document.getElementById('btnPlay').addEventListener('click', startNewGame);
  document.getElementById('btnContinue').addEventListener('click', continueGame);
  document.getElementById('btnJoin').addEventListener('click', () => {
    showScreen('join');
  });
  document.getElementById('btnJoinBack').addEventListener('click', () => {
    showScreen('start');
  });
  document.getElementById('btnJoinRoom').addEventListener('click', joinRoom);
  document.getElementById('btnPractice').addEventListener('click', () => {
    startPracticeBattle();
  });
  document.getElementById('btnHeroBack').addEventListener('click', () => {
    showScreen('start');
  });
  document.getElementById('btnHeroNext').addEventListener('click', finalizeHeroSelection);
  document.getElementById('btnRouteMenu').addEventListener('click', () => {
    showScreen('start');
  });
  document.getElementById('btnRouteNext').addEventListener('click', () => {
    if (!state.routeSelection) {
      setFooterMessage('Выберите следующий узел маршрута.');
      return;
    }
    handleRouteNode(state.routeSelection);
  });
  document.getElementById('btnEventBack').addEventListener('click', closeEvent);
  document.getElementById('btnBattleReset').addEventListener('click', resetPlayerSlots);
  document.getElementById('btnBattleConfirm').addEventListener('click', confirmBattleSlots);
  document.getElementById('btnBattleExit').addEventListener('click', () => {
    showScreen('route');
    updateRouteUI();
  });
  document.getElementById('btnResultMenu').addEventListener('click', () => {
    showScreen('start');
  });
  document.getElementById('btnResultNext').addEventListener('click', () => {
    showScreen('route');
    updateRouteUI();
  });
  document.getElementById('btnResultRetry').addEventListener('click', () => {
    showScreen('route');
    repeatBattle();
  });

  document.getElementById('cardInfoClose').addEventListener('click', closeCardInfo);
  document.getElementById('cardInfoCancel').addEventListener('click', closeCardInfo);
  document.getElementById('cardInfoOverlay').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeCardInfo();
    }
  });
  document.getElementById('cardInfoUse').addEventListener('click', () => {
    if (!ui.cardPreview) return;
    const placed = assignCardToSlot(ui.cardPreview);
    if (placed) {
      closeCardInfo();
    }
  });

}

// Initialization ----------------------------------------------------------
function init() {
  storageTest();
  loadPersistentState();
  setupButtons();
  setupHeroSelection();
  connectSocket();
  showScreen('start');
  updateRouteUI();
  renderPlayerDirectory();
  updateRoomIndicator();
  syncPlayerStatus();
  if (state.heroId) {
    document.getElementById('btnContinue').disabled = false;
  } else {
    document.getElementById('btnContinue').disabled = true;
  }
}

window.addEventListener('load', init);
