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
  if (window.location.hostname && window.location.hostname.includes('mazepark')) {
    return 'wss://mazepark-1.onrender.com';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const port = window.location.port || '8787';
  return `${protocol}://${window.location.hostname || 'localhost'}:${port}`;
})();

document.getElementById('serverUrl').textContent = WS_URL;

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
  }
};

const HEROES = {
  mage: {
    id: 'mage',
    name: 'Маг',
    hp: 24,
    deck: ['flame', 'frost', 'flash', 'heal', 'shield']
  },
  warrior: {
    id: 'warrior',
    name: 'Воин',
    hp: 28,
    deck: ['flame', 'flame', 'frost', 'shield', 'heal']
  }
};

const ENEMY_PROFILES = {
  easy: {
    id: 'easy',
    name: 'Эхо-скиталец',
    hp: 18,
    plan(state) {
      const lowHp = state.opponent.hp <= 8;
      const plan = [
        createEnemyCard(lowHp ? 'defense3' : 'attack3'),
        createEnemyCard('defense3'),
        createEnemyCard('attack2')
      ];
      return plan;
    }
  },
  medium: {
    id: 'medium',
    name: 'Страж отзвуков',
    hp: 22,
    plan(state) {
      const first = state.opponent.hp <= 8 && Math.random() < 0.5 ? createEnemyCard('defense3') : createEnemyCard('spell_reduce');
      return [
        first,
        createEnemyCard('attack3'),
        createEnemyCard('attack4')
      ];
    }
  }
};

// Enemy AI card factory
function createEnemyCard(kind) {
  switch (kind) {
    case 'attack4':
      return { id: 'enemy_attack4', name: 'Разрез Эха', type: 'attack', emoji: '🥊', rarity: 'enemy', baseDamage: 4 };
    case 'attack3':
      return { id: 'enemy_attack3', name: 'Рывок Тени', type: 'attack', emoji: '🥊', rarity: 'enemy', baseDamage: 3 };
    case 'attack2':
      return { id: 'enemy_attack2', name: 'Укус', type: 'attack', emoji: '🥊', rarity: 'enemy', baseDamage: 2 };
    case 'defense3':
      return { id: 'enemy_defense3', name: 'Щит Тени', type: 'defense', emoji: '🛡️', rarity: 'enemy', block: 3, reflect: 0 };
    case 'spell_reduce':
      return { id: 'enemy_reduce', name: 'Оковы Мороза', type: 'spell', emoji: '✨', rarity: 'enemy', effect: 'reduceOpponent' };
    default:
      return { id: 'enemy_pass', name: 'Пауза', type: 'spell', emoji: '✨', rarity: 'enemy', effect: 'none' };
  }
}

// Persistent state keys
const STORAGE_KEYS = {
  hero: 'mf_hero',
  deck: 'mf_deck',
  route: 'mf_route_index',
  room: 'mf_room_code'
};

const state = {
  screen: 'start',
  heroId: null,
  heroHp: 0,
  heroMaxHp: 0,
  deck: [],
  routeIndex: 0,
  roomCode: null,
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
    localStorage.setItem(STORAGE_KEYS.hero, state.heroId);
  }
  localStorage.setItem(STORAGE_KEYS.route, String(state.routeIndex));
  const deckPayload = state.deck.map((inst) => ({ cardId: inst.cardId, burned: inst.burned }));
  localStorage.setItem(STORAGE_KEYS.deck, JSON.stringify(deckPayload));
  if (state.roomCode && state.pvp.role === 'host') {
    localStorage.setItem(STORAGE_KEYS.room, state.roomCode);
  }
}

function clearPersistentState() {
  localStorage.removeItem(STORAGE_KEYS.hero);
  localStorage.removeItem(STORAGE_KEYS.deck);
  localStorage.removeItem(STORAGE_KEYS.route);
  localStorage.removeItem(STORAGE_KEYS.room);
}

function loadPersistentState() {
  const heroId = localStorage.getItem(STORAGE_KEYS.hero);
  const deckPayload = localStorage.getItem(STORAGE_KEYS.deck);
  const routeIndex = parseInt(localStorage.getItem(STORAGE_KEYS.route), 10);
  const roomCode = localStorage.getItem(STORAGE_KEYS.room);
  if (heroId && HEROES[heroId]) {
    state.heroId = heroId;
    state.heroMaxHp = HEROES[heroId].hp;
    state.heroHp = HEROES[heroId].hp;
  }
  if (!Number.isNaN(routeIndex)) {
    state.routeIndex = routeIndex;
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
}

function resetRun() {
  state.heroId = null;
  state.heroHp = 0;
  state.heroMaxHp = 0;
  state.deck = [];
  state.routeIndex = 0;
  state.roomCode = null;
  state.pvp.role = null;
  state.pvp.opponentReady = false;
  state.pvp.opponentSlots = [null, null, null];
  state.pvp.ready = false;
  savePersistentState();
  localStorage.removeItem(STORAGE_KEYS.room);
}

function updateRouteUI() {
  document.getElementById('routeRoomCode').textContent = state.roomCode || '—';
  const info = document.getElementById('routeInfo');
  if (state.routeIndex >= 5) {
    info.textContent = 'Маршрут завершён. Можно начать заново или заняться PvP.';
  } else {
    const progress = Math.min(state.routeIndex + 1, 5);
    info.textContent = `Текущий прогресс: узел ${progress} из 5.`;
  }
  const buttons = document.querySelectorAll('#routeNodes .route-node');
  buttons.forEach((btn) => {
    const nodeIndex = Number(btn.dataset.node);
    const isActive = nodeIndex === state.routeIndex;
    btn.disabled = !isActive;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('completed', nodeIndex < state.routeIndex);
  });
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
      break;
    case 'JOINED':
      state.pvp.role = msg.role;
      state.roomCode = msg.roomCode;
      if (msg.role === 'host') {
        localStorage.setItem(STORAGE_KEYS.room, state.roomCode);
      }
      setFooterMessage(`Вы подключены как ${msg.role === 'host' ? 'хост' : 'гость'} (${msg.roomCode})`);
      if (msg.role === 'guest') {
        document.getElementById('joinStatus').textContent = `Подключено к комнате ${msg.roomCode}. Ожидаем хоста.`;
        showScreen('start');
      }
      updateRouteUI();
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
  savePersistentState();
  document.getElementById('btnContinue').disabled = false;
  showScreen('route');
  updateRouteUI();
}

// Event helpers -----------------------------------------------------------
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
}

function closeEvent() {
  showScreen('route');
}

// Deck management ---------------------------------------------------------
function addCardToDeck(cardId) {
  const inst = createCardInstance(cardId);
  state.deck.push(inst);
  savePersistentState();
  setFooterMessage(`Получена карта: ${CARD_LIBRARY[cardId].name}`);
}

// Battle management -------------------------------------------------------
function startPveBattle(profileId, context = 'campaign') {
  const profile = ENEMY_PROFILES[profileId];
  const opponent = {
    name: profile.name,
    hp: profile.hp,
    maxHp: profile.hp,
    slots: [null, null, null],
    profileId
  };
  state.battle = {
    mode: profileId,
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
  startPveBattle('easy', 'practice');
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
      damageMod: 0
    },
    opponent: {
      block: 0,
      reflect: 0,
      nextPriority: false,
      slotOrder: [0, 1, 2],
      damageMod: 0
    }
  };
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
  const profile = ENEMY_PROFILES[battle.opponent.profileId];
  if (!profile) return [null, null, null];
  const planned = profile.plan({ opponent: battle.opponent, player: battle.player });
  return planned;
}

function renderBattle() {
  const playerHpFill = document.getElementById('playerHpFill');
  const opponentHpFill = document.getElementById('opponentHpFill');
  const playerHpText = document.getElementById('playerHpText');
  const opponentHpText = document.getElementById('opponentHpText');
  const battle = state.battle;
  playerHpText.textContent = `${Math.max(0, battle.player.hp)} / ${battle.player.maxHp}`;
  opponentHpText.textContent = `${Math.max(0, battle.opponent.hp)} / ${battle.opponent.maxHp}`;
  playerHpFill.style.width = `${Math.max(0, (battle.player.hp / battle.player.maxHp) * 100)}%`;
  opponentHpFill.style.width = `${Math.max(0, (battle.opponent.hp / battle.opponent.maxHp) * 100)}%`;
  renderPlayerSlots();
  renderOpponentSlots();
  renderCardPool();
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
    button.disabled = Boolean(inst.inUse);
    button.innerHTML = `<span class="emoji">${cardDef.emoji}</span><span>${cardDef.name}</span>`;
    button.addEventListener('click', () => assignCardToSlot(inst.instanceId));
    container.appendChild(button);
  });
}

function assignCardToSlot(instanceId) {
  const battle = state.battle;
  const instance = findCardInstance(instanceId);
  if (!instance || instance.inUse) return;
  if (state.battle.mode === 'pvp' && state.pvp.ready) {
    setPvpReady(false);
  }
  const nextSlot = battle.player.slots.findIndex((slot) => slot === null);
  if (nextSlot === -1) {
    updateBattleStatus('Все три слота заняты. Очистите слот для замены.');
    return;
  }
  battle.player.slots[nextSlot] = instance;
  instance.inUse = true;
  renderPlayerSlots();
  renderCardPool();
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
    order.forEach((side) => {
      const slotIndex = getSlotIndexForSide(side, step);
      const card = getCardAtSlot(side, slotIndex);
      if (!card) {
        updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} — слот ${slotIndex + 1}: пусто.`);
        return;
      }
      revealSlot(side, slotIndex, card);
      applyCardEffect(side, card, step);
      if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
        return;
      }
    });
    battle.temp.player.block = 0;
    battle.temp.player.reflect = 0;
    battle.temp.opponent.block = 0;
    battle.temp.opponent.reflect = 0;
    if (battle.player.hp <= 0 || battle.opponent.hp <= 0) break;
  }

  concludeRound();
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
      const total = Math.max(0, base + actorState.damageMod);
      const damage = def.effect === 'execute' ? attemptExecute(side, target) : applyDamage(target, total, side);
      if (def.apply === 'frost') {
        targetState.damageMod -= 1;
        updateBattleLog(`${side === 'player' ? 'Игрок' : 'Оппонент'} охлаждает цель: -1 к урону до конца раунда.`);
      }
      if (def.effect === 'execute' && damage === 'executed') {
        updateBattleLog('Клинок Судьбы завершает бой!');
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
        case 'reduceOpponent':
          targetState.damageMod -= 1;
          updateBattleLog('Оппонент теряет 1 урона до конца раунда.');
          break;
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

  checkVictoryState();
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
  }
}

function finishBattle() {
  const battle = state.battle;
  const playerWon = battle.player.hp > 0 && battle.opponent.hp <= 0;
  const opponentWon = battle.opponent.hp > 0 && battle.player.hp <= 0;
  const resultTitle = document.getElementById('resultTitle');
  const resultSummary = document.getElementById('resultSummary');
  if (playerWon) {
    resultTitle.textContent = 'Победа!';
    resultSummary.textContent = 'Вы разгромили соперника.';
    state.heroHp = battle.player.hp;
    if (battle.context === 'campaign') {
      state.routeIndex = Math.min(state.routeIndex + 1, 5);
      savePersistentState();
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
  if (['easy', 'medium'].includes(state.battle.mode)) {
    startPveBattle(state.battle.mode);
  } else if (state.battle.mode === 'pvp') {
    startPvpBattle();
  }
}

// Route node handlers -----------------------------------------------------
function handleRouteNode(nodeIndex) {
  switch (nodeIndex) {
    case 0:
      startPveBattle('easy', 'campaign');
      break;
    case 1:
      openHealingEvent();
      break;
    case 2:
      startPveBattle('medium', 'campaign');
      break;
    case 3:
      openLootEvent();
      break;
    case 4:
      startPvPNode();
      break;
    default:
      break;
  }
}

function openHealingEvent() {
  openEvent(
    'Узел помощи',
    'Энергия зеркала исцеляет или усиливает вас.',
    [
      {
        text: 'Сияющий луч восполняет здоровье.',
        button: '+3 HP',
        action: () => {
          state.heroHp = Math.min(state.heroMaxHp, state.heroHp + 3);
          updateRouteAfterEvent();
        }
      },
      {
        text: 'Зеркальная тренировка открывает новую карту.',
        button: 'Получить «Жар Пламени»',
        action: () => {
          addCardToDeck('flame');
          updateRouteAfterEvent();
        }
      }
    ]
  );
}

function openLootEvent() {
  const lootCards = ['flame', 'power', 'disrupt', 'fate', 'wrath', 'flash', 'shield'];
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
  closeEvent();
  state.routeIndex += 1;
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
    timeoutReached: false
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
  document.getElementById('btnEventBack').addEventListener('click', closeEvent);
  document.getElementById('btnBattleReset').addEventListener('click', resetPlayerSlots);
  document.getElementById('btnBattleConfirm').addEventListener('click', confirmBattleSlots);
  document.getElementById('btnBattleExit').addEventListener('click', () => {
    showScreen('route');
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

  document.querySelectorAll('#routeNodes .route-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleRouteNode(Number(btn.dataset.node));
    });
  });
}

// Initialization ----------------------------------------------------------
function init() {
  loadPersistentState();
  setupButtons();
  setupHeroSelection();
  connectSocket();
  showScreen('start');
  updateRouteUI();
  if (state.heroId) {
    document.getElementById('btnContinue').disabled = false;
  } else {
    document.getElementById('btnContinue').disabled = true;
  }
}

window.addEventListener('load', init);
