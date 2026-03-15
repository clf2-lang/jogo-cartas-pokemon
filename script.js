/**
 * Pokémon TCG – script.js
 * Interactive card game with PokeAPI sprites and CPU AI
 *
 * Mechanics mirror game.py:
 *  - damage = attacker.ataque - (defender.defesa * 0.5), min 10
 *  - Evolution: +50 HP (fully restored), +20 ATK, +15 DEF, name → "Mega X"
 */

'use strict';

/* =====================================================================
   CONSTANTS / DATA
   ===================================================================== */

const SPRITE_BASE   = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const ARTWORK_BASE  = `${SPRITE_BASE}/other/official-artwork`;

/**
 * Returns the URL for the official artwork sprite.
 */
function spriteUrl(pokeId) {
  return `${ARTWORK_BASE}/${pokeId}.png`;
}
function spriteSmall(pokeId) {
  return `${SPRITE_BASE}/${pokeId}.png`;
}

/** All available Pokémon cards */
const POKEMON_CATALOG = [
  { id:'pikachu',    nome:'Pikachu',    elemento:'Eletrico', hp:100, ataque:80,  defesa:40, pokeId:25,  evolucaoId:26,  evolucaoNome:'Raichu'    },
  { id:'charmander', nome:'Charmander', elemento:'Fogo',     hp:110, ataque:85,  defesa:35, pokeId:4,   evolucaoId:6,   evolucaoNome:'Charizard'  },
  { id:'squirtle',   nome:'Squirtle',   elemento:'Agua',     hp:120, ataque:70,  defesa:55, pokeId:7,   evolucaoId:9,   evolucaoNome:'Blastoise'  },
  { id:'bulbasaur',  nome:'Bulbasaur',  elemento:'Grama',    hp:115, ataque:75,  defesa:50, pokeId:1,   evolucaoId:3,   evolucaoNome:'Venusaur'   },
  { id:'gengar',     nome:'Gengar',     elemento:'Fantasma', hp:90,  ataque:95,  defesa:30, pokeId:94,  evolucaoId:94,  evolucaoNome:'Mega Gengar' },
  { id:'snorlax',    nome:'Snorlax',    elemento:'Normal',   hp:160, ataque:65,  defesa:65, pokeId:143, evolucaoId:143, evolucaoNome:'Mega Snorlax'},
  { id:'mewtwo',     nome:'Mewtwo',     elemento:'Psiquico', hp:130, ataque:110, defesa:70, pokeId:150, evolucaoId:150, evolucaoNome:'Mega Mewtwo'},
  { id:'eevee',      nome:'Eevee',      elemento:'Normal',   hp:110, ataque:70,  defesa:50, pokeId:133, evolucaoId:197, evolucaoNome:'Umbreon'    },
  { id:'psyduck',    nome:'Psyduck',    elemento:'Agua',     hp:100, ataque:75,  defesa:45, pokeId:54,  evolucaoId:55,  evolucaoNome:'Golduck'    },
  { id:'vulpix',     nome:'Vulpix',     elemento:'Fogo',     hp:95,  ataque:78,  defesa:42, pokeId:37,  evolucaoId:38,  evolucaoNome:'Ninetales'  },
  { id:'gastly',     nome:'Gastly',     elemento:'Fantasma', hp:80,  ataque:85,  defesa:25, pokeId:92,  evolucaoId:94,  evolucaoNome:'Gengar'     },
  { id:'abra',       nome:'Abra',       elemento:'Psiquico', hp:85,  ataque:90,  defesa:25, pokeId:63,  evolucaoId:65,  evolucaoNome:'Alakazam'   },
];

/** All evolution stones */
const STONES_CATALOG = [
  { id:'trovao', nome:'Pedra Trovão',  elemento:'Eletrico', emoji:'⚡', color:'#f9cf05' },
  { id:'fogo',   nome:'Pedra Fogo',    elemento:'Fogo',     emoji:'🔥', color:'#ff6b35' },
  { id:'agua',   nome:'Pedra Água',    elemento:'Agua',     emoji:'💧', color:'#38b6ff' },
  { id:'folha',  nome:'Pedra Folha',   elemento:'Grama',    emoji:'🍃', color:'#56d05e' },
  { id:'lua',    nome:'Pedra Lua',     elemento:'Normal',   emoji:'🌙', color:'#9b59b6' },
  { id:'psiqui', nome:'Pedra Psíquica',elemento:'Psiquico', emoji:'🔮', color:'#f06acd' },
  { id:'sombra', nome:'Pedra Sombria', elemento:'Fantasma', emoji:'👻', color:'#6c3483' },
];

/** Element → CSS class suffix */
const EL_CLASS = {
  Eletrico: 'eletrico',
  Fogo:     'fogo',
  Agua:     'agua',
  Grama:    'grama',
  Normal:   'normal',
  Psiquico: 'psiquico',
  Fantasma: 'fantasma',
  Pedra:    'pedra',
};

/* =====================================================================
   GAME STATE
   ===================================================================== */

let G = {};   // game state, reset each game

function freshPokemon(data) {
  return {
    ...data,
    hpAtual: data.hp,
    hpMax:   data.hp,
    evoluido: false,
    currentPokeId:  data.pokeId,
    currentNome:    data.nome,
    currentEvoId:   data.evolucaoId,
    currentEvoNome: data.evolucaoNome,
  };
}

function initGameState() {
  // Build decks – each player gets a shuffled copy of the catalog
  const deck1 = shuffle(POKEMON_CATALOG.map(freshPokemon));
  const deck2 = shuffle(POKEMON_CATALOG.map(freshPokemon));

  // Stones – give each player 4 random stones (duplicates allowed via shuffle)
  const allStones = shuffle([...STONES_CATALOG, ...STONES_CATALOG]);
  const stones1 = allStones.slice(0, 4);
  const stones2 = allStones.slice(4, 8);

  G = {
    phase: 'dice',          // dice | player-pick | player-stone | player-attack | cpu | game-over
    currentTurn: 0,         // 0 = player, 1 = cpu
    players: [
      { name:'Você', deck: deck1.slice(4), hand: deck1.slice(0,4), active: null, stones: stones1 },
      { name:'CPU',  deck: deck2.slice(4), hand: deck2.slice(0,4), active: null, stones: stones2 },
    ],
    selectedHandIdx: null,  // index in player's hand that is highlighted
    selectedStoneIdx: null, // index in player's stones array
    cpuActing: false,
  };
}

/* =====================================================================
   UTILITIES
   ===================================================================== */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function calcDamage(attacker, defender) {
  const base = attacker.ataque - defender.defesa * 0.5;
  return Math.max(10, Math.floor(base));
}

function hpPercent(poke) { return (poke.hpAtual / poke.hpMax) * 100; }

function hpBarClass(poke) {
  const pct = hpPercent(poke);
  if (pct > 50) return '';
  if (pct > 25) return 'hp-mid';
  return 'hp-low';
}

function elClass(elemento) { return EL_CLASS[elemento] || 'normal'; }

/* =====================================================================
   DOM REFERENCES
   ===================================================================== */

const $  = id => document.getElementById(id);
const $$ = sel => document.querySelector(sel);

/* =====================================================================
   LOGGING
   ===================================================================== */

function addLog(msg, type = 'info') {
  const log  = $('battle-log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = msg;
  log.prepend(entry);
  // Keep log trimmed
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

/* =====================================================================
   RENDER
   ===================================================================== */

function renderAll() {
  renderHeader();
  renderArena();
  renderPlayerHand();
  renderCpuHand();
  renderStones();
  renderActiveStatus();
  renderActionButtons();
}

function renderHeader() {
  const p = G.players[0];
  const c = G.players[1];
  $('player-deck-count').textContent = p.deck.length;
  $('cpu-deck-count').textContent    = c.deck.length;

  const badge    = $('turn-badge');
  const turnText = $('turn-text');
  const turnIcon = $('turn-icon');
  const hint     = $('phase-hint');

  if (G.phase === 'game-over') return;

  if (G.currentTurn === 1) {
    badge.className    = 'turn-badge cpu-turn';
    turnIcon.textContent = '🤖';
    turnText.textContent = 'Turno: CPU';
    hint.textContent   = 'CPU está pensando…';
  } else {
    badge.className    = 'turn-badge player-turn';
    turnIcon.textContent = '👤';
    turnText.textContent = 'Turno: Você';
    switch (G.phase) {
      case 'player-pick':   hint.textContent = 'Selecione uma carta da sua mão'; break;
      case 'player-stone':  hint.textContent = 'Use uma pedra (opcional) ou ataque'; break;
      case 'player-attack': hint.textContent = 'Pronto para atacar!'; break;
      default:              hint.textContent = '';
    }
  }
}

function renderArena() {
  renderActivePokemon('player');
  renderActivePokemon('cpu');
}

function buildArenaCard(poke, side) {
  const pct   = hpPercent(poke);
  const elCls = elClass(poke.elemento);
  const card  = document.createElement('div');
  card.className = `arena-card glow-${elCls}`;
  card.dataset.side = side;

  card.innerHTML = `
    ${poke.evoluido ? `<div class="evo-badge">✨ Mega</div>` : ''}
    <img
      class="arena-sprite"
      src="${spriteUrl(poke.currentPokeId)}"
      alt="${poke.currentNome}"
      onerror="this.src='${spriteSmall(poke.currentPokeId)}'"
      id="sprite-${side}"
    />
    <div class="arena-name">${poke.currentNome}</div>
    <span class="el-badge el-${elCls}">${poke.elemento}</span>
    <div class="hp-row">
      <div class="hp-label">
        <span>HP</span>
        <span class="hp-cur">${poke.hpAtual} / ${poke.hpMax}</span>
      </div>
      <div class="hp-bar-bg">
        <div
          class="hp-bar-fill ${hpBarClass(poke)}"
          style="width:${pct}%"
        ></div>
      </div>
    </div>
    <div class="arena-stats">
      <span>⚔️ <strong>${poke.ataque}</strong></span>
      <span>🛡️ <strong>${poke.defesa}</strong></span>
    </div>
  `;
  return card;
}

function renderActivePokemon(side) {
  const slotId = side === 'player' ? 'player-active-slot' : 'cpu-active-slot';
  const slot   = $(slotId);
  const poke   = G.players[side === 'player' ? 0 : 1].active;

  slot.innerHTML = '';
  if (!poke) {
    const ph = document.createElement('div');
    ph.className = 'slot-placeholder';
    ph.textContent = side === 'player' ? 'Selecione uma carta 👇' : 'Aguardando…';
    slot.appendChild(ph);
  } else {
    slot.appendChild(buildArenaCard(poke, side));
  }
}

function renderPlayerHand() {
  const hand    = G.players[0].hand;
  const active  = G.players[0].active;
  const container = $('player-hand');
  container.innerHTML = '';

  hand.forEach((poke, idx) => {
    const card = document.createElement('div');
    card.className = 'hand-card';
    if (idx === G.selectedHandIdx) card.classList.add('selected');

    card.innerHTML = `
      <img
        class="hand-sprite"
        src="${spriteSmall(poke.currentPokeId)}"
        alt="${poke.currentNome}"
      />
      <div class="hand-name">${poke.currentNome}</div>
      <div class="hand-el el-badge el-${elClass(poke.elemento)}" style="font-size:8px;padding:1px 5px;">${poke.elemento}</div>
      <div class="hand-hp">HP: ${poke.hpAtual}</div>
    `;

    container.appendChild(card);
  });

  // Show active card indicator
  if (active) {
    const activeTag = document.createElement('div');
    activeTag.className = 'hand-card active-card';
    activeTag.innerHTML = `
      <img
        class="hand-sprite"
        src="${spriteSmall(active.currentPokeId)}"
        alt="${active.currentNome}"
      />
      <div class="hand-name">${active.currentNome}</div>
      <div class="hand-label-playing">Em batalha</div>
      <div class="hand-hp">HP: ${active.hpAtual}</div>
    `;
    container.prepend(activeTag);
  }
}

function renderCpuHand() {
  const count = G.players[1].hand.length;
  const display = $('cpu-hand-display');
  display.innerHTML = '';
  $('cpu-hand-count').textContent = count;

  for (let i = 0; i < count; i++) {
    const back = document.createElement('div');
    back.className = 'cpu-card-back';
    display.appendChild(back);
  }
}

function renderStones() {
  const stones = G.players[0].stones;
  const grid   = $('stones-display');
  grid.innerHTML = '';

  if (stones.length === 0) {
    grid.innerHTML = '<div style="font-size:11px;color:#666;grid-column:1/-1">Nenhuma pedra</div>';
    return;
  }

  stones.forEach((stone, idx) => {
    const el = document.createElement('div');
    el.className = 'stone-item';
    if (idx === G.selectedStoneIdx) el.classList.add('selected');

    el.innerHTML = `
      <div class="stone-emoji">${stone.emoji}</div>
      <div class="stone-name">${stone.nome}</div>
      <div class="stone-el" style="color:${stone.color}">${stone.elemento}</div>
    `;

    // Only selectable during player's turn phases
    if (G.phase === 'player-stone' || G.phase === 'player-attack') {
      el.addEventListener('click', () => onStoneClick(idx));
    }
    grid.appendChild(el);
  });
}

function renderActiveStatus() {
  const poke = G.players[0].active;
  const box  = $('active-status');
  if (!poke) {
    box.innerHTML = '<div class="status-empty">Nenhum Pokémon</div>';
    return;
  }
  const pct = hpPercent(poke);
  const elCls = elClass(poke.elemento);
  box.innerHTML = `
    <div class="status-name">
      ${poke.currentNome}
      <span class="status-el-badge el-badge el-${elCls}">${poke.elemento}</span>
    </div>
    <div class="status-hp-label">HP: <span class="status-hp-val">${poke.hpAtual}/${poke.hpMax}</span></div>
    <div class="mini-bar-wrap">
      <div class="mini-bar ${hpBarClass(poke)}" style="width:${pct}%;background:${pct>50?'#43a047':pct>25?'#ffb300':'#e53935'}"></div>
    </div>
    <div class="status-stats">
      <span>⚔️ <strong>${poke.ataque}</strong></span>
      <span>🛡️ <strong>${poke.defesa}</strong></span>
      ${poke.evoluido ? '<span>✨ Mega</span>' : ''}
    </div>
  `;
}

function renderActionButtons() {
  const btnStone  = $('btn-use-stone');
  const btnAttack = $('btn-attack');

  const stoneReady  = G.phase === 'player-stone' && G.selectedStoneIdx !== null;
  const attackReady = (G.phase === 'player-stone' || G.phase === 'player-attack') && G.players[0].active && G.players[1].active;

  btnStone.disabled  = !stoneReady;
  btnAttack.disabled = !attackReady;
}

/* =====================================================================
   EVENT HANDLERS
   ===================================================================== */

function onStoneClick(idx) {
  if (G.currentTurn !== 0) return;
  G.selectedStoneIdx = (G.selectedStoneIdx === idx) ? null : idx;
  renderStones();
  renderActionButtons();
}

function onUseStone() {
  if (G.selectedStoneIdx === null) return;
  const player = G.players[0];
  const stone  = player.stones[G.selectedStoneIdx];
  const poke   = player.active;

  if (!poke) { addLog('Nenhum Pokémon ativo para usar a pedra.', 'system'); return; }

  const result = evolvePokemon(poke, stone);
  if (result) {
    // Remove stone
    player.stones.splice(G.selectedStoneIdx, 1);
    G.selectedStoneIdx = null;

    // Animate evolution
    const sprite = $('sprite-player');
    if (sprite) sprite.classList.add('sprite-evolve');
    setTimeout(() => sprite && sprite.classList.remove('sprite-evolve'), 1700);

    flashScreen('flash-gold');
    addLog(`✨ ${poke.currentNome} evoluiu! HP+50, ATK+20, DEF+15`, 'evolve');

    G.phase = 'player-attack';
    renderAll();
  }
}

function onAttack() {
  if (G.currentTurn !== 0) return;
  if (!G.players[0].active || !G.players[1].active) return;

  const attacker = G.players[0].active;
  const defender = G.players[1].active;
  const dmg      = calcDamage(attacker, defender);

  addLog(`⚔️ ${attacker.currentNome} ataca ${defender.currentNome}!`, 'attack');

  animateAttack('player', 'cpu', dmg, () => {
    defender.hpAtual -= dmg;
    if (defender.hpAtual < 0) defender.hpAtual = 0;
    addLog(`💔 ${defender.currentNome} recebeu ${dmg} de dano! HP: ${defender.hpAtual}/${defender.hpMax}`, 'damage');

    if (defender.hpAtual === 0) {
      addLog(`💀 ${defender.currentNome} foi derrotado!`, 'faint');
      G.players[1].active = null;
      renderAll();
      setTimeout(() => afterFaint(1), 600);
    } else {
      renderAll();
      setTimeout(() => beginCpuTurn(), 800);
    }
  });

  // Reset selection state
  G.selectedHandIdx  = null;
  G.selectedStoneIdx = null;
}

/* =====================================================================
   EVOLUTION
   ===================================================================== */

function evolvePokemon(poke, stone) {
  if (poke.evoluido) {
    addLog(`⚠️ ${poke.currentNome} já atingiu sua forma máxima!`, 'system');
    return false;
  }
  if (stone.elemento !== poke.elemento) {
    addLog(`❌ ${stone.nome} não funciona em ${poke.currentNome} (${poke.elemento}).`, 'system');
    return false;
  }

  // Evolve
  poke.hpMax    += 50;
  poke.hpAtual   = poke.hpMax;        // Full HP restore on evolution
  poke.ataque   += 20;
  poke.defesa   += 15;
  poke.evoluido  = true;
  poke.currentNome   = poke.currentEvoNome;
  poke.currentPokeId = poke.currentEvoId;

  addLog(`🚀 ${poke.currentNome} evoluiu! ATK ${poke.ataque} / DEF ${poke.defesa}`, 'evolve');
  return true;
}

/* =====================================================================
   AFTER A POKÉMON FAINTS
   ===================================================================== */

/**
 * Called when the Pokémon of `playerIdx` has fainted.
 * Draws a card if needed, sets active, or triggers game over.
 */
function afterFaint(playerIdx) {
  const player = G.players[playerIdx];

  // Draw until hand has a card (or deck is empty)
  while (player.hand.length === 0 && player.deck.length > 0) {
    player.hand.push(player.deck.pop());
  }

  if (player.hand.length === 0) {
    // No cards left → this player loses
    const winner = G.players[playerIdx === 0 ? 1 : 0];
    endGame(winner.name);
    return;
  }

  if (playerIdx === 0) {
    // Human must pick next card; set their turn so clicks are accepted
    G.currentTurn = 0;
    G.phase = 'player-pick';
    addLog('👉 Escolha seu próximo Pokémon!', 'system');
    renderAll();
  } else {
    // CPU picks best card (highest ATK)
    const bestIdx = player.hand.reduce((best, p, i, arr) =>
      p.ataque > arr[best].ataque ? i : best, 0);
    cpuPlayCard(bestIdx);
    renderAll();
    // After CPU picks, give player their turn
    if (G.players[0].active) {
      setTimeout(() => {
        G.currentTurn = 0;
        G.phase = 'player-stone';
        addLog('↩️ De volta ao seu turno!', 'system');
        renderAll();
      }, 600);
    }
  }
}

/* =====================================================================
   TURN FLOW
   ===================================================================== */

function beginPlayerTurn() {
  G.currentTurn = 0;
  G.selectedHandIdx  = null;
  G.selectedStoneIdx = null;

  // Draw one card if deck available
  drawCard(0);

  if (!G.players[0].active) {
    G.phase = 'player-pick';
    addLog('👉 Escolha qual Pokémon jogar!', 'system');
  } else {
    G.phase = 'player-stone';
    addLog(`🎯 Turno do Jogador – ${G.players[0].active.currentNome} está na batalha`, 'system');
  }
  renderAll();
}

function beginCpuTurn() {
  G.currentTurn = 1;
  G.phase = 'cpu';
  renderAll();

  setTimeout(() => cpuTurn(), 1000);
}

function drawCard(playerIdx) {
  const player = G.players[playerIdx];
  if (player.deck.length > 0 && player.hand.length < 6) {
    player.hand.push(player.deck.pop());
  }
}

/* =====================================================================
   PLAY CARD FROM HAND (HUMAN)
   ===================================================================== */

function playCardFromHand(playerIdx, handIdx) {
  const player = G.players[playerIdx];
  const poke   = player.hand.splice(handIdx, 1)[0];
  player.active = poke;
  G.selectedHandIdx = null;

  addLog(`🃏 ${player.name} jogou ${poke.currentNome}!`, 'system');

  if (playerIdx === 0) {
    G.phase = 'player-stone';
    renderAll();
  }
}

/* =====================================================================
   CPU AI
   ===================================================================== */

function cpuPlayCard(handIdx) {
  const cpu  = G.players[1];
  const poke = cpu.hand.splice(handIdx, 1)[0];
  cpu.active = poke;
  addLog(`🤖 CPU jogou ${poke.currentNome}!`, 'system');
}

function cpuTurn() {
  if (G.cpuActing) return;
  G.cpuActing = true;

  const cpu    = G.players[1];
  const player = G.players[0];

  // Draw
  drawCard(1);
  renderCpuHand();

  // Play card if no active
  if (!cpu.active) {
    if (cpu.hand.length === 0) { endGame(player.name); G.cpuActing = false; return; }
    const bestIdx = cpu.hand.reduce((b, p, i, arr) => p.ataque > arr[b].ataque ? i : b, 0);
    cpuPlayCard(bestIdx);
    renderActivePokemon('cpu');
    addLog('🤖 CPU colocou um Pokémon em batalha!', 'system');
  }

  // Try to use a stone (40% chance if compatible)
  const compatStones = cpu.stones
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.elemento === cpu.active.elemento && !cpu.active.evoluido);

  if (compatStones.length > 0 && Math.random() < 0.4) {
    const { s, i } = compatStones[0];
    const evolved  = evolvePokemon(cpu.active, s);
    if (evolved) {
      cpu.stones.splice(i, 1);
      const sprite = $('sprite-cpu');
      if (sprite) sprite.classList.add('sprite-evolve');
      setTimeout(() => sprite && sprite.classList.remove('sprite-evolve'), 1700);
      flashScreen('flash-gold');
      addLog(`✨ CPU usou ${s.nome}!`, 'evolve');
      renderActivePokemon('cpu');
    }
  }

  // Attack
  setTimeout(() => {
    if (!player.active) {
      // Player has no active → player picks
      G.cpuActing = false;
      G.phase = 'player-pick';
      addLog('👉 Escolha seu próximo Pokémon!', 'system');
      renderAll();
      return;
    }

    const attacker = cpu.active;
    const defender = player.active;
    const dmg      = calcDamage(attacker, defender);

    addLog(`🤖 ${attacker.currentNome} ataca ${defender.currentNome}!`, 'attack');

    animateAttack('cpu', 'player', dmg, () => {
      defender.hpAtual -= dmg;
      if (defender.hpAtual < 0) defender.hpAtual = 0;
      addLog(`💔 ${defender.currentNome} recebeu ${dmg} de dano! HP: ${defender.hpAtual}/${defender.hpMax}`, 'damage');

      if (defender.hpAtual === 0) {
        addLog(`💀 ${defender.currentNome} foi derrotado!`, 'faint');
        G.players[0].active = null;
        renderAll();
        G.cpuActing = false;
        setTimeout(() => afterFaint(0), 600);
      } else {
        G.cpuActing = false;
        renderAll();
        setTimeout(() => beginPlayerTurn(), 600);
      }
    });
  }, 1200);
}

/* =====================================================================
   ANIMATIONS
   ===================================================================== */

function animateAttack(attackerSide, targetSide, dmg, onComplete) {
  const targetSprite = $(`sprite-${targetSide}`);
  if (targetSprite) {
    const cls = targetSide === 'player' ? 'sprite-shake-right' : 'sprite-shake-left';
    targetSprite.classList.add(cls);
    setTimeout(() => targetSprite.classList.remove(cls), 500);
  }

  flashScreen('flash-red');
  showFloatingDamage(dmg, targetSide);

  setTimeout(onComplete, 500);
}

function showFloatingDamage(dmg, side) {
  const slot = $(side === 'player' ? 'player-active-slot' : 'cpu-active-slot');
  if (!slot) return;

  const rect = slot.getBoundingClientRect();
  const el   = document.createElement('div');
  el.className = 'dmg-float';
  el.textContent = `-${dmg}`;
  el.style.left = `${rect.left + rect.width / 2 - 30}px`;
  el.style.top  = `${rect.top  + rect.height / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function flashScreen(cls) {
  const overlay = $('flash-overlay');
  overlay.className = `flash-overlay ${cls}`;
  setTimeout(() => { overlay.className = 'flash-overlay hidden'; }, 500);
}

/* =====================================================================
   DICE ROLL
   ===================================================================== */

function rollDice() {
  const modal    = $('dice-modal');
  const dPlayer  = $('dice-player');
  const dCpu     = $('dice-cpu');
  const result   = $('dice-result');

  modal.classList.remove('hidden');
  dPlayer.className = 'dice rolling';
  dCpu.className    = 'dice rolling';
  result.textContent = 'Rolando dados…';

  let ticks = 0;
  const interval = setInterval(() => {
    dPlayer.textContent = rand(1, 6);
    dCpu.textContent    = rand(1, 6);
    ticks++;
    if (ticks > 12) {
      clearInterval(interval);
      finalizeDice(dPlayer, dCpu, result, modal);
    }
  }, 100);
}

function finalizeDice(dPlayer, dCpu, result, modal) {
  dPlayer.className = 'dice';
  dCpu.className    = 'dice';

  let pRoll = rand(1, 6);
  let cRoll = rand(1, 6);
  // Re-roll one die at a time until they differ (bounded loop, guaranteed termination)
  for (let attempts = 0; attempts < 20 && pRoll === cRoll; attempts++) {
    cRoll = rand(1, 6);
  }
  // Final tiebreaker: if still equal, arbitrarily give player the higher value
  if (pRoll === cRoll) { pRoll = 6; cRoll = 5; }

  dPlayer.textContent = pRoll;
  dCpu.textContent    = cRoll;

  if (pRoll > cRoll) {
    result.textContent = '🎉 Você começa!';
    G.currentTurn = 0;
    addLog(`🎲 Dados: Você ${pRoll} × CPU ${cRoll} – Você começa!`, 'system');
  } else {
    result.textContent = '🤖 CPU começa!';
    G.currentTurn = 1;
    addLog(`🎲 Dados: CPU ${cRoll} × Você ${pRoll} – CPU começa!`, 'system');
  }

  setTimeout(() => {
    modal.classList.add('hidden');
    if (G.currentTurn === 0) {
      beginPlayerTurn();
    } else {
      G.phase = 'cpu';
      renderAll();
      setTimeout(() => cpuTurn(), 800);
    }
  }, 1400);
}

/* =====================================================================
   GAME OVER
   ===================================================================== */

function endGame(winnerName) {
  G.phase = 'game-over';
  const isPlayer = winnerName === 'Você';

  $('gameover-emoji').textContent = isPlayer ? '🏆' : '😢';
  $('gameover-text').textContent  = isPlayer ? 'Você Venceu!' : 'CPU Venceu!';

  addLog(isPlayer ? '🏆 Você ganhou a partida!' : '🤖 CPU ganhou a partida!', 'win');

  // Show game-over screen
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('gameover-screen').classList.add('active');
}

/* =====================================================================
   START / RESTART
   ===================================================================== */

function startGame() {
  // Hide start → show game
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('gameover-screen').classList.remove('active');

  // Reset log
  $('battle-log').innerHTML = '';

  initGameState();
  renderAll();

  addLog('🎮 Bem-vindo ao Pokémon TCG!', 'system');
  addLog('🃏 Clique em uma carta da sua mão para jogar!', 'system');

  setTimeout(() => rollDice(), 400);
}

/* =====================================================================
   BUTTON WIRING
   ===================================================================== */

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

document.getElementById('btn-use-stone').addEventListener('click', () => {
  if (G.currentTurn !== 0) return;
  onUseStone();
});

document.getElementById('btn-attack').addEventListener('click', () => {
  if (G.currentTurn !== 0) return;
  if (G.phase !== 'player-stone' && G.phase !== 'player-attack') return;
  if (!G.players[0].active) return;

  // If no CPU active, CPU needs to play a card first
  if (!G.players[1].active) {
    addLog('⚠️ CPU não tem Pokémon ativo ainda.', 'system');
    return;
  }
  onAttack();
});

// Hand card click – event delegation on the container
document.getElementById('player-hand').addEventListener('click', e => {
  if (G.currentTurn !== 0) return;
  if (G.cpuActing) return;

  const card = e.target.closest('.hand-card');
  if (!card) return;

  // Ignore the "in battle" indicator (has class active-card)
  if (card.classList.contains('active-card')) return;

  // Calculate index into G.players[0].hand
  // The active-card indicator (if present) is prepended, so offset by 1
  const allCards = [...document.getElementById('player-hand').children];
  const domIdx   = allCards.indexOf(card);
  if (domIdx < 0) return;
  const handIdx  = G.players[0].active ? domIdx - 1 : domIdx;
  if (handIdx < 0) return;

  if (G.phase === 'player-pick') {
    if (G.selectedHandIdx === handIdx) {
      // Second click → play the card
      playCardFromHand(0, handIdx);
      G.selectedHandIdx = null;
      renderAll();
    } else {
      // First click → select
      G.selectedHandIdx = handIdx;
      renderPlayerHand();
      renderActionButtons();
    }

  } else if (G.phase === 'player-stone') {
    if (G.selectedHandIdx === handIdx) {
      // Second click on same card → swap active Pokémon
      if (G.players[0].active) {
        G.players[0].hand.push(G.players[0].active);
        G.players[0].active = null;
      }
      playCardFromHand(0, handIdx);
      G.selectedHandIdx = null;
      renderAll();
    } else {
      // First click → highlight as potential swap
      G.selectedHandIdx = handIdx;
      renderPlayerHand();
    }
  }
});
