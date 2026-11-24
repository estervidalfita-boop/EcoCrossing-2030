/* =========================================================
   GUARDADO AUTOMÁTICO Y REINICIO
   ========================================================= */
function saveGameState() {
  try {
    if (!Array.isArray(game.grid) || game.grid.length === 0) return;
    const compactGrid = [];
    for (let r = 0; r < MAX_GRID; r++) {
      for (let c = 0; c < MAX_GRID; c++) {
        const cell = game.grid[r][c];
        if (cell.building || cell.prop) {
          compactGrid.push({
            r,
            c,
            bId: cell.building ? cell.building.id : null,
            prop: cell.prop || null
          });
        }
      }
    }

    const payload = {
      coins: game.coins,
      timeMinutes: game.timeMinutes,
      islandRadius: game.islandRadius,
      expandCount: game.expandCount,
      questIndex: game.questIndex,
      questBaseCount: game.questBaseCount,
      questRecycleDone: game.questRecycleDone,
      recycleHighScore: game.recycleHighScore,
      unlockedOds: Array.from(game.unlockedOds),
      victoryShown: game.victoryShown,
      musicEnabled: game.musicEnabled,
      musicUserPaused: game.musicUserPaused,
      sfxEnabled: game.sfxEnabled,
      cells: compactGrid
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Sin fallos si el almacenamiento está restringido
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.cells)) return false;

    game.coins = typeof data.coins === 'number' ? data.coins : 420;
    game.timeMinutes = typeof data.timeMinutes === 'number' ? data.timeMinutes : 12 * 60;
    game.islandRadius = Math.max(2, Math.min(game.maxRadius, data.islandRadius || 2));
    game.expandCount = Math.max(0, data.expandCount || 0);
    game.questIndex = Math.max(0, data.questIndex || 0);
    game.questBaseCount = Math.max(0, data.questBaseCount || 0);
    game.questRecycleDone = Boolean(data.questRecycleDone);
    game.recycleHighScore = Math.max(0, data.recycleHighScore || 0);
    game.unlockedOds = new Set(Array.isArray(data.unlockedOds) && data.unlockedOds.length ? data.unlockedOds : ['ods2']);
    game.victoryShown = Boolean(data.victoryShown);
    game.musicEnabled = data.musicEnabled !== undefined ? Boolean(data.musicEnabled) : true;
    game.musicUserPaused = Boolean(data.musicUserPaused);
    game.sfxEnabled = data.sfxEnabled !== undefined ? Boolean(data.sfxEnabled) : true;

    buildBaseGridSkeleton();

    for (const entry of data.cells) {
      if (entry.r >= 0 && entry.r < MAX_GRID && entry.c >= 0 && entry.c < MAX_GRID) {
        const cell = game.grid[entry.r][entry.c];
        cell.prop = entry.prop || null;
        if (entry.bId) {
          const found = ODS_CATALOG.find(item => item.id === entry.bId);
          if (found) {
            cell.building = { ...found };
            cell.prop = null;
          }
        }
      }
    }

    syncAudioButtonsUI();
    initWalkers();
    return true;
  } catch (err) {
    return false;
  }
}

function resetSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {}
  game.coins = 420;
  game.timeMinutes = 12 * 60;
  game.islandRadius = 2;
  game.expandCount = 0;
  game.questIndex = 0;
  game.questRecycleDone = false;
  game.unlockedOds = new Set(['ods2']);
  game.victoryShown = false;
  game.selectedBuildId = null;
  game.demolishMode = false;

  initTerrain();
  resetCamera();
  closeAlbumModal();
  renderShop();
  checkQuestProgress();
  updateStats();
  saveGameState();
  showToast('🌱', '¡Nueva isla creada desde cero!');
}

/* =========================================================
   RELIEVE, EXPANSIÓN Y VECINOS
   ========================================================= */
function computeElevation(r, c) {
  const dx = r - CENTER;
  const dy = c - CENTER;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(r * 0.75) * 0.65 + Math.cos(c * 0.75) * 0.65;

  if (dist < 2.2) return Math.max(2, Math.round(3 + wave * 0.6));
  if (dist < 5.2) return Math.max(1, Math.round(2 + wave * 0.8));
  if (dist < 8.0) return Math.max(1, Math.round(1.4 + wave * 0.6));
  return 1;
}

function buildBaseGridSkeleton() {
  game.grid = [];
  for (let r = 0; r < MAX_GRID; r++) {
    const row = [];
    for (let c = 0; c < MAX_GRID; c++) {
      const distCheb = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));
      row.push({
        r,
        c,
        elevation: computeElevation(r, c),
        unlocked: distCheb <= game.islandRadius,
        building: null,
        prop: null
      });
    }
    game.grid.push(row);
  }
}

function initTerrain() {
  buildBaseGridSkeleton();

  for (let r = 0; r < MAX_GRID; r++) {
    for (let c = 0; c < MAX_GRID; c++) {
      const distCheb = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));
      const cell = game.grid[r][c];
      if (r === CENTER - 1 && c === CENTER - 1) {
        cell.prop = 'tree';
      } else if (r === CENTER + 1 && c === CENTER + 1) {
        cell.prop = 'rock';
      } else if (distCheb <= game.islandRadius && (r + c) % 3 === 0 && !(r === CENTER && c === CENTER)) {
        cell.prop = (r * c) % 2 === 0 ? 'tree' : 'flower';
      }
    }
  }

  const starter = ODS_CATALOG.find(item => item.id === 'ods2');
  if (starter) {
    game.grid[CENTER][CENTER].building = { ...starter };
    game.grid[CENTER][CENTER].prop = null;
  }

  const starterHouse = ODS_CATALOG.find(item => item.id === 'house_eco');
  if (starterHouse && CENTER + 1 < MAX_GRID) {
    game.grid[CENTER][CENTER + 1].building = { ...starterHouse };
    game.grid[CENTER][CENTER + 1].prop = null;
  }

  setupQuestBaseline(QUESTS[game.questIndex % QUESTS.length]);
  game.questRecycleDone = false;
  initWalkers();
}

function initWalkers() {
  const emojis = ['🐼', '🦊', '🦉', '🐨', '🦔'];
  game.walkers = emojis.map((emoji, idx) => ({
    emoji,
    r: CENTER + ((idx % 3) - 1),
    c: CENTER + (Math.floor(idx / 3) === 0 ? -1 : 1),
    targetR: CENTER,
    targetC: CENTER,
    progress: 0,
    speed: 0.008 + idx * 0.0015
  }));
  game.walkers.forEach(pickNewWalkerTarget);
}

function pickNewWalkerTarget(walker) {
  const candidates = [];
  for (let dr = -game.islandRadius; dr <= game.islandRadius; dr++) {
    for (let dc = -game.islandRadius; dc <= game.islandRadius; dc++) {
      const r = CENTER + dr;
      const c = CENTER + dc;
      if (r >= 0 && r < MAX_GRID && c >= 0 && c < MAX_GRID && game.grid[r][c].unlocked) {
        candidates.push({ r, c });
      }
    }
  }
  if (candidates.length > 0) {
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    walker.targetR = next.r;
    walker.targetC = next.c;
    walker.progress = 0;
  }
}

function updateWalkers() {
  for (const w of game.walkers) {
    w.progress += w.speed;
    if (w.progress >= 1) {
      w.r = w.targetR;
      w.c = w.targetC;
      pickNewWalkerTarget(w);
    }
  }
}

function getExpandCost() {
  return 140 + game.expandCount * 75;
}

function expandTerritory(freeReward = false) {
  if (freeReward) return false;

  if (game.islandRadius >= game.maxRadius) {
    showToast('🏝️', '¡Tu isla ya alcanzó su tamaño máximo!');
    return false;
  }

  const cost = getExpandCost();
  if (game.coins < cost) {
    showToast('🪙', `Necesitas ${cost} EcoCoins para comprar la ampliación`);
    playTone('error');
    return false;
  }

  game.coins -= cost;
  game.islandRadius = Math.min(game.maxRadius, game.islandRadius + game.expandStep);
  game.expandCount++;

  let newlyUnlocked = 0;
  for (let r = 0; r < MAX_GRID; r++) {
    for (let c = 0; c < MAX_GRID; c++) {
      const distCheb = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));
      const cell = game.grid[r][c];
      if (!cell.unlocked && distCheb <= game.islandRadius) {
        cell.unlocked = true;
        newlyUnlocked++;
        if (!cell.building && !cell.prop && (r + c) % 4 === 0) {
          cell.prop = distCheb > 6 ? 'rock' : 'tree';
        }
        const pos = gridToScreen(r, c, cell.elevation);
        spawnParticles(pos.x, pos.y, '#34d399', 4);
      }
    }
  }

  playTone('quest');
  updateExpandButton();
  updateStats();
  saveGameState();
  showToast('🗺️', `¡Terreno ampliado por ${cost}🪙! +${newlyUnlocked} parcelas`);
  return true;
}

function updateExpandButton() {
  const btn = document.getElementById('btn-expand');
  const label = document.getElementById('expand-cost-label');
  if (!btn || !label) return;

  if (game.islandRadius >= game.maxRadius) {
    label.textContent = 'Máximo';
    btn.disabled = true;
  } else {
    const cost = getExpandCost();
    label.textContent = `Ampliar ${cost}🪙`;
    btn.disabled = game.coins < cost;
  }
}

/* =========================================================
   INTERACCIÓN TÁCTIL Y RATÓN
   ========================================================= */
let isDragging = false;
let pointerMoved = false;
let lastPointerX = 0;
let lastPointerY = 0;
let pinchStartDist = 0;
let pinchStartZoom = 1;

function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

if (canvas) {
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isDragging = false;
      pinchStartDist = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartZoom = game.zoom;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      isDragging = true;
      pointerMoved = false;
      lastPointerX = t.clientX - rect.left;
      lastPointerY = t.clientY - rect.top;
      game.hoverCell = screenToGrid(lastPointerX, lastPointerY);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchStartDist > 0) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchStartDist;
      game.zoom = Math.max(game.minZoom, Math.min(game.maxZoom, pinchStartZoom * ratio));
      return;
    }

    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const px = t.clientX - rect.left;
      const py = t.clientY - rect.top;
      const dx = px - lastPointerX;
      const dy = py - lastPointerY;

      if (Math.hypot(dx, dy) > 6) {
        pointerMoved = true;
      }

      if (pointerMoved) {
        game.camX += dx;
        game.camY += dy;
        lastPointerX = px;
        lastPointerY = py;
      } else {
        game.hoverCell = screenToGrid(px, py);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      if (isDragging && !pointerMoved) {
        handleTileTap(lastPointerX, lastPointerY);
      }
      isDragging = false;
      pinchStartDist = 0;
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    isDragging = true;
    pointerMoved = false;
    lastPointerX = e.clientX - rect.left;
    lastPointerY = e.clientY - rect.top;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    adjustZoom(e.deltaY < 0 ? 0.12 : -0.12);
  }, { passive: false });
}

window.addEventListener('mousemove', (e) => {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  game.hoverCell = screenToGrid(px, py);

  if (isDragging) {
    const dx = px - lastPointerX;
    const dy = py - lastPointerY;
    if (Math.hypot(dx, dy) > 5) {
      pointerMoved = true;
    }
    if (pointerMoved) {
      game.camX += dx;
      game.camY += dy;
      lastPointerX = px;
      lastPointerY = py;
    }
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging && !pointerMoved) {
    handleTileTap(lastPointerX, lastPointerY);
  }
  isDragging = false;
});

function handleTileTap(px, py) {
  ensureAudioContext();
  const cellCoord = screenToGrid(px, py);
  if (!cellCoord) return;

  const cell = game.grid[cellCoord.r][cellCoord.c];
  game.hoverCell = cellCoord;
  const pos = gridToScreen(cell.r, cell.c, cell.elevation);

  if (!cell.unlocked) {
    showToast('🔒', 'Usa "Ampliar" con tus monedas para desbloquear esta zona');
    playTone('error');
    return;
  }

  if (game.demolishMode) {
    if (!cell.building) {
      showToast('ℹ️', 'No hay ningún edificio aquí para demoler');
      return;
    }
    const refund = Math.round(cell.building.cost * 0.5);
    game.coins += refund;
    cell.building = null;
    playTone('demolish');
    spawnParticles(pos.x, pos.y, '#ef4444', 10);
    spawnFloatingText(pos.x, pos.y - 12, `+${refund}🪙`, '#fde047');
    showToast('🏗️', `Edificio demolido (+${refund} EcoCoins)`);
    checkQuestProgress();
    updateStats();
    saveGameState();
    return;
  }

  if (game.selectedBuildId) {
    if (cell.building) {
      showToast('⚠️', 'Parcela ocupada. Elige otra o activa demoler');
      playTone('error');
      return;
    }
    const item = ODS_CATALOG.find(o => o.id === game.selectedBuildId);
    if (!item) return;

    if (game.coins < item.cost) {
      showToast('🪙', `Te faltan ${item.cost - game.coins} EcoCoins para ${item.name}`);
      playTone('error');
      return;
    }

    game.coins -= item.cost;
    cell.building = { ...item };
    cell.prop = null;
    game.unlockedOds.add(item.id);

    playTone('build');
    spawnParticles(pos.x, pos.y - 8, item.color, 12);
    spawnFloatingText(pos.x, pos.y - 18, `${item.emoji} ODS ${item.ods}`, '#ffffff');
    showToast('✨', `${item.name} construido (ODS ${item.ods} desbloqueado)`);

    checkQuestProgress();
    renderShop();
    updateStats();
    saveGameState();
    checkVictory();
    return;
  }

  if (cell.building) {
    const b = cell.building;
    showToast(b.emoji, `${b.name} • ODS ${b.ods}: ${b.title}`);
  } else {
    showToast('🌿', `Parcela fértil (Altura ${cell.elevation}). Elige un edificio abajo`);
  }
}

/* =========================================================
   MÉTRICAS, MISIONES, ÁLBUM Y MINIJUEGO
   ========================================================= */
function countBuildingType(targetId) {
  let total = 0;
  for (let r = 0; r < MAX_GRID; r++) {
    for (let c = 0; c < MAX_GRID; c++) {
      const b = game.grid[r][c].building;
      if (b && b.id === targetId) total++;
    }
  }
  return total;
}

function countCategoryBuildings(targetCat) {
  let total = 0;
  for (let r = 0; r < MAX_GRID; r++) {
    for (let c = 0; c < MAX_GRID; c++) {
      const b = game.grid[r][c].building;
      if (b && b.cat === targetCat) total++;
    }
  }
  return total;
}

function setupQuestBaseline(quest) {
  if (quest.type === 'build') {
    game.questBaseCount = countBuildingType(quest.targetId);
  } else if (quest.type === 'category') {
    game.questBaseCount = countCategoryBuildings(quest.targetCat);
  } else {
    game.questBaseCount = 0;
  }
}

function calculateMetrics() {
  let ecoSum = 44;
  let happySum = 54;
  let prodMW = 0;
  let consMW = 0;
  let incomeCycle = 12;
  let totalBuildings = 0;
  let houseCount = 0;

  for (let r = 0; r < MAX_GRID; r++) {
    for (let c = 0; c < MAX_GRID; c++) {
      const cell = game.grid[r][c];
      if (!cell.unlocked) continue;
      if (!cell.building && cell.prop === 'tree') ecoSum += 1;
      if (cell.building) {
        totalBuildings++;
        const b = cell.building;
        if (b.id === 'house_eco') houseCount++;
        ecoSum += b.eco;
        happySum += b.happy;
        incomeCycle += b.income;
        if (b.energy >= 0) prodMW += b.energy;
        else consMW += Math.abs(b.energy);
      }
    }
  }

  const housingCapacity = 4 + houseCount * 4;
  const population = 3 + Math.max(0, totalBuildings - houseCount) * 2 + houseCount * 3;
  const housingDeficit = Math.max(0, population - housingCapacity);

  if (housingDeficit > 0) {
    happySum -= housingDeficit * 3;
  } else if (houseCount > 0) {
    happySum += 2;
  }

  const balanceMW = prodMW - consMW;
  if (balanceMW < 0) {
    happySum += balanceMW * 2;
    ecoSum -= 3;
  } else if (prodMW > 0) {
    ecoSum += 3;
    happySum += 2;
  }

  game.planet = Math.max(0, Math.min(100, ecoSum));
  game.happy = Math.max(0, Math.min(100, happySum));

  return { prodMW, consMW, balanceMW, incomeCycle, totalBuildings, population, housingCapacity, housingDeficit };
}

function updateStats() {
  const m = calculateMetrics();
  document.getElementById('stat-coins').textContent = Math.floor(game.coins);
  document.getElementById('stat-income').textContent = `+${m.incomeCycle}/ciclo`;
  document.getElementById('stat-planet').textContent = `${game.planet}%`;
  document.getElementById('stat-happy').textContent = `${game.happy}%`;

  const happyNoteEl = document.getElementById('stat-happy-note');
  if (happyNoteEl) {
    if (m.housingDeficit > 0) {
      happyNoteEl.textContent = `⚠️ ${m.population}/${m.housingCapacity} casas`;
      happyNoteEl.style.color = '#dc2626';
    } else {
      happyNoteEl.textContent = `🏠 ${m.population}/${m.housingCapacity} vec.`;
      happyNoteEl.style.color = '#059669';
    }
  }

  const sign = m.balanceMW >= 0 ? '+' : '';
  const energyEl = document.getElementById('stat-energy');
  energyEl.textContent = `${sign}${m.balanceMW} MW`;
  energyEl.style.color = m.balanceMW >= 0 ? '#0369a1' : '#dc2626';
  document.getElementById('stat-energy-detail').textContent = `${m.prodMW} / ${m.consMW} MW`;

  document.getElementById('hdr-ods-count').textContent = game.unlockedOds.size;

  let rank = '🌱 Aldea Inicial';
  if (game.unlockedOds.size >= 14 && game.planet >= 80) rank = '🌟 Metrópoli 2030';
  else if (game.unlockedOds.size >= 8) rank = '🏙️ Ciudad Sostenible';
  else if (game.unlockedOds.size >= 4) rank = '🌿 Villa Ecológica';
  document.getElementById('island-rank').textContent = `${rank} • ${game.unlockedOds.size}/17 ODS • ${m.population}/${m.housingCapacity} vec.`;

  checkQuestProgress();
  updateExpandButton();
}

function evaluateQuestState() {
  const q = QUESTS[game.questIndex % QUESTS.length];
  const m = calculateMetrics();

  if (q.type === 'build') {
    const currentCount = countBuildingType(q.targetId);
    const delta = Math.max(0, currentCount - game.questBaseCount);
    return {
      done: delta >= 1,
      pct: Math.min(100, delta * 100),
      label: `Progreso: ${Math.min(1, delta)}/1`
    };
  }

  if (q.type === 'category') {
    const needed = q.targetDelta || 2;
    const currentCount = countCategoryBuildings(q.targetCat);
    const delta = Math.max(0, currentCount - game.questBaseCount);
    const capped = Math.min(needed, delta);
    return {
      done: delta >= needed,
      pct: Math.min(100, Math.round((capped / needed) * 100)),
      label: `Construidos: ${capped}/${needed}`
    };
  }

  if (q.type === 'eco') {
    const target = q.targetEco || 65;
    return {
      done: game.planet >= target,
      pct: Math.min(100, Math.round((game.planet / target) * 100)),
      label: `Ecología: ${game.planet}% / ${target}%`
    };
  }

  if (q.type === 'energy_pos') {
    const ok = m.balanceMW > 0;
    return {
      done: ok,
      pct: ok ? 100 : 35,
      label: ok ? `Balance listo (${m.balanceMW} MW)` : `Balance actual: ${m.balanceMW} MW`
    };
  }

  if (q.type === 'recycle') {
    return {
      done: game.questRecycleDone,
      pct: game.questRecycleDone ? 100 : 0,
      label: game.questRecycleDone ? 'Reciclaje completado (1/1)' : 'Juega a Reciclar (0/1)'
    };
  }

  return { done: false, pct: 0, label: '0/1' };
}

function checkQuestProgress() {
  const status = evaluateQuestState();
  game.questCompleted = status.done;
  renderQuest(status);
}

function claimQuest() {
  if (!game.questCompleted) return;
  const q = QUESTS[game.questIndex % QUESTS.length];
  game.coins += q.reward;
  game.happy = Math.min(100, game.happy + 5);

  game.questIndex++;
  const nextQ = QUESTS[game.questIndex % QUESTS.length];
  setupQuestBaseline(nextQ);
  game.questRecycleDone = false;
  game.questCompleted = false;

  playTone('quest');
  showToast('🎉', `+${q.reward}🪙 reclamados. ¡Cómpralos para ampliar la isla!`);
  checkQuestProgress();
  updateStats();
  saveGameState();
}

function renderQuest(status = evaluateQuestState()) {
  const q = QUESTS[game.questIndex % QUESTS.length];
  const targetObj = q.targetId ? ODS_CATALOG.find(o => o.id === q.targetId) : null;

  document.getElementById('quest-avatar').textContent = q.avatar;
  document.getElementById('quest-author').textContent = q.author;
  document.getElementById('quest-ods-badge').textContent = `ODS ${q.ods}`;
  document.getElementById('quest-desc').textContent = `${q.desc}${targetObj ? ` (${targetObj.name})` : ''}`;
  document.getElementById('quest-reward').textContent = `+${q.reward} 🪙`;
  document.getElementById('quest-progress-bar').style.width = `${status.pct}%`;
  document.getElementById('quest-progress-label').textContent = status.label;

  const btnClaim = document.getElementById('btn-claim-quest');
  const dot = document.getElementById('quest-dot');

  if (game.questCompleted) {
    btnClaim.style.display = 'block';
    btnClaim.textContent = `¡Reclamar +${q.reward}🪙! 🎉`;
    dot.classList.add('pulse');
  } else {
    btnClaim.style.display = 'none';
    dot.classList.remove('pulse');
  }
}

function checkVictory() {
  if (game.victoryShown) return;
  const m = calculateMetrics();
  if (game.unlockedOds.size >= 17 && game.planet >= 80 && m.balanceMW >= 0) {
    game.victoryShown = true;
    saveGameState();
    playTone('quest');
    document.getElementById('info-modal-emoji').textContent = '🏆';
    document.getElementById('info-modal-title').textContent = '¡Objetivo 2030 Completado!';
    document.getElementById('info-modal-body').textContent =
      `¡Increíble! Has desbloqueado los 17 ODS, alcanzado ${game.planet}% de Ecología y un balance energético positivo. ¡Tu isla es un referente sostenible!`;
    document.getElementById('info-modal').classList.add('open');
  }
}

/* =========================================================
   INTERFAZ DEL DOCK, CATÁLOGO, ÁLBUM Y MINIJUEGO
   ========================================================= */
function switchMobileTab(tab) {
  const btnShop = document.getElementById('tab-shop');
  const btnQuest = document.getElementById('tab-quest');
  const viewShop = document.getElementById('view-shop');
  const viewQuest = document.getElementById('view-quest');
  const hint = document.getElementById('shop-hint');

  if (tab === 'shop') {
    btnShop.classList.add('active');
    btnQuest.classList.remove('active');
    viewShop.style.display = 'block';
    viewQuest.classList.remove('active');
    hint.textContent = 'Desliza el catálogo →';
  } else {
    btnQuest.classList.add('active');
    btnShop.classList.remove('active');
    viewShop.style.display = 'none';
    viewQuest.classList.add('active');
    hint.textContent = 'Completa y reclama';
  }
}

function filterShop(cat, btnEl) {
  game.activeFilter = cat;
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderShop();
}

function renderShop() {
  const list = document.getElementById('shop-list');
  if (!list) return;
  list.innerHTML = '';

  const items = game.activeFilter === 'all'
    ? ODS_CATALOG
    : ODS_CATALOG.filter(o => o.cat === game.activeFilter);

  items.forEach(item => {
    const card = document.createElement('div');
    const isSel = game.selectedBuildId === item.id;
    const canAfford = game.coins >= item.cost;

    card.className = `shop-card ${isSel ? 'selected' : ''} ${!canAfford ? 'too-expensive' : ''}`;
    card.onclick = () => selectBuild(item.id);

    const energyText = item.energy > 0 ? `+${item.energy}⚡` : (item.energy < 0 ? `${item.energy}⚡` : '0⚡');

    card.innerHTML = `
      <div>
        <div class="shop-card-top">
          <span class="shop-emoji">${item.emoji}</span>
          <span class="ods-tag" style="background:${item.color};">ODS ${item.ods}</span>
        </div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-stats">
          <span class="shop-stat-eco">+${item.eco}🌿</span>
          <span class="shop-stat-en">${energyText}</span>
        </div>
      </div>
      <div class="shop-price">${item.cost} 🪙</div>
    `;
    list.appendChild(card);
  });
}

function selectBuild(id) {
  game.demolishMode = false;
  updateToolButtons();

  if (game.selectedBuildId === id) {
    game.selectedBuildId = null;
  } else {
    game.selectedBuildId = id;
  }

  const ind = document.getElementById('selected-indicator');
  if (game.selectedBuildId) {
    const item = ODS_CATALOG.find(o => o.id === game.selectedBuildId);
    document.getElementById('sel-ind-emoji').textContent = item.emoji;
    document.getElementById('sel-ind-text').textContent = `${item.name} (${item.cost}🪙)`;
    ind.style.display = 'flex';
    showToast(item.emoji, `Toca una parcela de la isla para colocar ${item.name}`);
  } else {
    ind.style.display = 'none';
  }
  renderShop();
}

function clearSelection() {
  game.selectedBuildId = null;
  game.demolishMode = false;
  document.getElementById('selected-indicator').style.display = 'none';
  updateToolButtons();
  renderShop();
  showToast('👆', 'Modo inspección activado');
}

function toggleDemolishMode() {
  game.selectedBuildId = null;
  game.demolishMode = !game.demolishMode;
  document.getElementById('selected-indicator').style.display = 'none';
  updateToolButtons();
  renderShop();
  if (game.demolishMode) {
    showToast('🗑️', 'Toca un edificio para demolerlo (recuperas el 50%)');
  } else {
    showToast('👆', 'Modo inspección activado');
  }
}

function updateToolButtons() {
  const btnInspect = document.getElementById('btn-inspect');
  const btnDemolish = document.getElementById('btn-demolish');
  btnInspect.classList.toggle('active-inspect', !game.demolishMode && !game.selectedBuildId);
  btnDemolish.classList.toggle('active-demolish', game.demolishMode);
}

function openAlbumModal() {
  const grid = document.getElementById('album-grid');
  grid.innerHTML = '';
  document.getElementById('album-count').textContent = `${game.unlockedOds.size} / 17`;
  document.getElementById('album-record').textContent = game.recycleHighScore;

  ODS_CATALOG.forEach(item => {
    const unlocked = game.unlockedOds.has(item.id);
    const card = document.createElement('div');
    card.className = `ods-card ${unlocked ? 'unlocked' : 'locked'}`;
    if (unlocked) {
      card.style.backgroundColor = item.color;
      card.onclick = () => {
        document.querySelectorAll('.ods-card').forEach(c => c.classList.remove('selected-fact'));
        card.classList.add('selected-fact');
        document.getElementById('ods-fact-box').innerHTML =
          `<strong>ODS ${item.ods} - ${item.title}:</strong> ${item.fact}`;
      };
    }
    card.innerHTML = `
      <span class="ods-card-emoji">${unlocked ? item.emoji : '🔒'}</span>
      <span class="ods-card-label">ODS ${item.ods}</span>
    `;
    grid.appendChild(card);
  });

  document.getElementById('album-modal').classList.add('open');
}

function closeAlbumModal() {
  document.getElementById('album-modal').classList.remove('open');
}

let mgTimerId = null;
let mgTimeLeft = 25;
let mgScore = 0;
let mgCurrentItem = null;
let mgLocked = false;

function openMiniGameModal() {
  mgTimeLeft = 25;
  mgScore = 0;
  mgLocked = false;
  document.getElementById('mg-timer').textContent = `${mgTimeLeft}s`;
  document.getElementById('mg-score').textContent = '0';
  document.getElementById('mg-feedback').textContent = '';
  pickNextRecycleItem();
  document.getElementById('minigame-modal').classList.add('open');

  clearInterval(mgTimerId);
  mgTimerId = setInterval(() => {
    mgTimeLeft--;
    document.getElementById('mg-timer').textContent = `${mgTimeLeft}s`;
    if (mgTimeLeft <= 0) {
      finishMiniGame();
    }
  }, 1000);
}

function closeMiniGameModal() {
  clearInterval(mgTimerId);
  document.getElementById('minigame-modal').classList.remove('open');
}

function pickNextRecycleItem() {
  mgCurrentItem = RECYCLE_ITEMS[Math.floor(Math.random() * RECYCLE_ITEMS.length)];
  document.getElementById('mg-item-emoji').textContent = mgCurrentItem.emoji;
  document.getElementById('mg-item-name').textContent = mgCurrentItem.name;
}

function answerMiniGame(binCode) {
  if (mgLocked || mgTimeLeft <= 0 || !mgCurrentItem) return;

  if (binCode === mgCurrentItem.bin) {
    mgScore += 15;
    document.getElementById('mg-score').textContent = mgScore;
    document.getElementById('mg-feedback').style.color = '#059669';
    document.getElementById('mg-feedback').textContent = '¡Correcto! +15 pts';
    playTone('build');
    pickNextRecycleItem();
  } else {
    mgScore = Math.max(0, mgScore - 10);
    mgLocked = true;
    document.getElementById('mg-score').textContent = mgScore;
    document.getElementById('mg-feedback').style.color = '#dc2626';
    document.getElementById('mg-feedback').textContent = '¡Contenedor incorrecto! -10 pts';
    playTone('error');
    setTimeout(() => {
      mgLocked = false;
      document.getElementById('mg-feedback').textContent = '';
      pickNextRecycleItem();
    }, 600);
  }
}

function finishMiniGame() {
  clearInterval(mgTimerId);
  const earned = Math.max(15, Math.round(mgScore * 1.5));
  game.coins += earned;
  game.questRecycleDone = true;
  if (mgScore > game.recycleHighScore) {
    game.recycleHighScore = mgScore;
  }

  updateStats();
  saveGameState();
  closeMiniGameModal();
  playTone('quest');

  document.getElementById('info-modal-emoji').textContent = '♻️';
  document.getElementById('info-modal-title').textContent = '¡Reciclaje Completado!';
  document.getElementById('info-modal-body').textContent =
    `Conseguiste ${mgScore} puntos y ganaste +${earned} EcoCoins para seguir ampliando y cuidando tu isla.`;
  document.getElementById('info-modal').classList.add('open');
}

function closeInfoModal() {
  document.getElementById('info-modal').classList.remove('open');
}

function openRestartModal() {
  document.getElementById('restart-modal').classList.add('open');
}

function closeRestartModal() {
  document.getElementById('restart-modal').classList.remove('open');
}

function confirmRestartGame() {
  closeRestartModal();
  resetSavedGame();
}

function takeIslandSnapshot() {
  try {
    if (!canvas) return;
    renderScene();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ecocrossing-2030-isla-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playTone('quest');
    showToast('📸', '¡Foto PNG de tu isla descargada!');
  } catch (err) {
    showToast('⚠️', 'No se pudo exportar la imagen en este navegador');
  }
}

function showToast(icon, msg) {
  const iconEl = document.getElementById('overlay-icon');
  const textEl = document.getElementById('overlay-text');
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = msg;
}

/* =========================================================
   CICLO TEMPORAL Y BUCLE PRINCIPAL
   ========================================================= */
function updateClock() {
  game.timeMinutes = (game.timeMinutes + 2) % (24 * 60);
  const hrs = Math.floor(game.timeMinutes / 60);
  const mins = game.timeMinutes % 60;
  const hStr = String(hrs).padStart(2, '0');
  const mStr = String(mins).padStart(2, '0');
  document.getElementById('time-text').textContent = `${hStr}:${mStr}`;

  const icon = document.getElementById('time-icon');
  if (hrs >= 6 && hrs < 19) {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

function tickEconomy() {
  const m = calculateMetrics();
  game.coins += m.incomeCycle;
  game.dynamicTimer++;

  if (game.dynamicTimer % 3 === 0 && m.totalBuildings > 0) {
    const unlockedCells = [];
    for (let r = CENTER - game.islandRadius; r <= CENTER + game.islandRadius; r++) {
      for (let c = CENTER - game.islandRadius; c <= CENTER + game.islandRadius; c++) {
        const cell = game.grid[r]?.[c];
        if (cell && cell.unlocked && cell.building) {
          unlockedCells.push(cell);
        }
      }
    }
    if (unlockedCells.length > 0) {
      const luckyCell = unlockedCells[Math.floor(Math.random() * unlockedCells.length)];
      const bonus = 15 + Math.min(35, m.totalBuildings * 3);
      game.coins += bonus;
      const pos = gridToScreen(luckyCell.r, luckyCell.c, luckyCell.elevation);
      spawnParticles(pos.x, pos.y - 10, '#fbbf24', 10);
      spawnFloatingText(pos.x, pos.y - 20, `⚡+${bonus}🪙`, '#fef08a');
      showToast('⚡', `¡Impulso sostenible! ${luckyCell.building.name} generó +${bonus}🪙 extra`);
    }
  }

  updateStats();
  saveGameState();
}

function gameLoop() {
  try {
    if (typeof renderScene === 'function') {
      renderScene();
    }
  } catch (err) {
    // Evita detener el bucle si el lienzo aún no está listo
  }
  requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }
  const restored = loadGameState();
  if (!restored) {
    initTerrain();
  }
  if (typeof syncAudioButtonsUI === 'function') {
    syncAudioButtonsUI();
  }
  if (typeof resetCamera === 'function') {
    resetCamera();
  }
  renderShop();
  updateStats();

  const unlockMusicOnGesture = () => {
    if (game.musicEnabled && !game.musicUserPaused && typeof ensureAudioContext === 'function') {
      ensureAudioContext();
      if (typeof startBackgroundMusic === 'function') {
        startBackgroundMusic();
      }
    }
    window.removeEventListener('pointerdown', unlockMusicOnGesture);
    window.removeEventListener('touchstart', unlockMusicOnGesture);
  };
  window.addEventListener('pointerdown', unlockMusicOnGesture, { once: false });
  window.addEventListener('touchstart', unlockMusicOnGesture, { once: false });

  setInterval(updateClock, 1000);
  setInterval(tickEconomy, 7000);
  requestAnimationFrame(gameLoop);
});