/* =========================================================
   RENDERIZADO ISOMÉTRICO EN RELIEVE (CANVAS 2D)
   ========================================================= */
const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let viewW = 400;
let viewH = 400;
const baseTileW = 64;
const baseTileH = 34;
const elevStepPx = 13;

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container || !canvas || !ctx) return;
  const rect = container.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewW = Math.max(240, rect.width);
  viewH = Math.max(220, rect.height);
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetCamera() {
  game.camX = 0;
  game.camY = 18;
  game.zoom = game.islandRadius > 4 ? 0.72 : 0.95;
}

function adjustZoom(delta) {
  game.zoom = Math.max(game.minZoom, Math.min(game.maxZoom, Number((game.zoom + delta).toFixed(2))));
}

function gridToScreen(r, c, elevation = 1) {
  const tw = baseTileW * game.zoom;
  const th = baseTileH * game.zoom;
  const dr = r - CENTER;
  const dc = c - CENTER;
  const isoX = (dc - dr) * (tw * 0.5);
  const isoY = (dc + dr) * (th * 0.5) - elevation * elevStepPx * game.zoom;
  return {
    x: viewW * 0.5 + game.camX + isoX,
    y: viewH * 0.46 + game.camY + isoY
  };
}

function screenToGrid(px, py) {
  const tw = baseTileW * game.zoom;
  const th = baseTileH * game.zoom;
  let picked = null;

  for (let sum = 0; sum <= (MAX_GRID - 1) * 2; sum++) {
    for (let r = 0; r < MAX_GRID; r++) {
      const c = sum - r;
      if (c < 0 || c >= MAX_GRID) continue;

      const cell = game.grid[r][c];
      const distCheb = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));
      if (!cell.unlocked && distCheb > game.islandRadius + game.expandStep) continue;

      const pos = gridToScreen(r, c, cell.elevation);
      const cx = pos.x;
      const cy = pos.y + th * 0.5;
      const dx = Math.abs(px - cx) / (tw * 0.5);
      const dy = Math.abs(py - cy) / (th * 0.5);

      if (dx + dy <= 1.03) {
        picked = { r, c };
      }
    }
  }
  return picked;
}

function drawIsoPrism(cx, topY, w, h, depth, topCol, leftCol, rightCol, borderCol = 'rgba(255,255,255,0.22)', alpha = 1) {
  const hw = w * 0.5;
  const hh = h * 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.moveTo(cx - hw, topY + hh);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(cx, topY + h + depth);
  ctx.lineTo(cx - hw, topY + hh + depth);
  ctx.closePath();
  ctx.fillStyle = leftCol;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + hw, topY + hh);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(cx, topY + h + depth);
  ctx.lineTo(cx + hw, topY + hh + depth);
  ctx.closePath();
  ctx.fillStyle = rightCol;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + hw, topY + hh);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(cx - hw, topY + hh);
  ctx.closePath();
  ctx.fillStyle = topCol;
  ctx.fill();

  if (borderCol) {
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function drawContactShadow(cx, cy, tw, th) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + th * 0.5, tw * 0.28, th * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getDaylightFactor() {
  const hours = (game.timeMinutes / 60) % 24;
  const angle = ((hours - 6) / 24) * Math.PI * 2;
  return Math.max(0.28, Math.min(1, 0.55 + Math.sin(angle) * 0.45));
}

function renderScene() {
  if (!ctx || !canvas || !Array.isArray(game.grid) || game.grid.length === 0) return;

  const light = getDaylightFactor();
  const hours = (game.timeMinutes / 60) % 24;
  const isNight = hours < 6 || hours >= 20;

  const seaGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  if (isNight) {
    seaGrad.addColorStop(0, '#0f172a');
    seaGrad.addColorStop(1, '#1e3a8a');
  } else {
    seaGrad.addColorStop(0, '#0284c7');
    seaGrad.addColorStop(1, '#0369a1');
  }
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  if (isNight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 97) % Math.max(120, viewW));
      const sy = ((i * 53) % Math.max(90, viewH * 0.35));
      const twinkle = 1 + Math.sin(Date.now() * 0.004 + i) * 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, twinkle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = isNight ? 'rgba(148,163,184,0.12)' : 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  const waveShift = (Date.now() * 0.025) % 48;
  for (let y = 24; y < viewH; y += 44) {
    ctx.beginPath();
    for (let x = -48 + waveShift; x < viewW + 48; x += 48) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 12, y - 5, x + 24, y);
      ctx.quadraticCurveTo(x + 36, y + 5, x + 48, y);
    }
    ctx.stroke();
  }

  const tw = baseTileW * game.zoom;
  const th = baseTileH * game.zoom;
  const previewItem = game.selectedBuildId ? ODS_CATALOG.find(o => o.id === game.selectedBuildId) : null;
  let tramCount = 0;

  for (let sum = 0; sum <= (MAX_GRID - 1) * 2; sum++) {
    for (let r = 0; r < MAX_GRID; r++) {
      const c = sum - r;
      if (c < 0 || c >= MAX_GRID) continue;

      const cell = game.grid[r][c];
      const distCheb = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));
      const isBorderPreview = !cell.unlocked && distCheb <= game.islandRadius + game.expandStep && distCheb <= game.maxRadius;

      if (!cell.unlocked && !isBorderPreview) continue;

      const pos = gridToScreen(r, c, cell.elevation);
      const depth = (cell.elevation * elevStepPx + 22) * game.zoom;

      const ecoRatio = game.planet / 100;
      let topCol = ecoRatio > 0.65 ? '#4ade80' : '#86efac';
      if (cell.elevation >= 3) {
        topCol = ecoRatio > 0.65 ? '#22c55e' : '#a3e635';
      } else if (distCheb >= game.islandRadius) {
        topCol = '#fde68a';
      }

      let leftCol = cell.elevation >= 3 ? '#64748b' : '#92400e';
      let rightCol = cell.elevation >= 3 ? '#475569' : '#78350f';

      if (!cell.unlocked) {
        topCol = 'rgba(226, 232, 240, 0.35)';
        leftCol = 'rgba(100, 116, 139, 0.25)';
        rightCol = 'rgba(71, 85, 105, 0.25)';
      }

      drawIsoPrism(pos.x, pos.y, tw, th, depth, topCol, leftCol, rightCol);

      const isHover = game.hoverCell && game.hoverCell.r === r && game.hoverCell.c === c;
      if (isHover && cell.unlocked) {
        const hw = tw * 0.5;
        const hh = th * 0.5;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + hw, pos.y + hh);
        ctx.lineTo(pos.x, pos.y + th);
        ctx.lineTo(pos.x - hw, pos.y + hh);
        ctx.closePath();
        ctx.fillStyle = game.demolishMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
        ctx.strokeStyle = game.demolishMode ? '#ef4444' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (previewItem && !cell.building && !game.demolishMode) {
          const pBw = tw * 0.58;
          const pBh = th * 0.58;
          const pDepth = 22 * game.zoom;
          const pTopY = pos.y + (th - pBh) * 0.5 - pDepth;
          drawIsoPrism(pos.x, pTopY, pBw, pBh, pDepth, previewItem.roof, previewItem.color, shadeHex(previewItem.color, -24), '#ffffff', 0.58);
        }
      }

      if (cell.unlocked && !cell.building && cell.prop) {
        drawContactShadow(pos.x, pos.y, tw * 0.65, th * 0.65);
        const sway = Math.sin(Date.now() * 0.003 + r + c) * 2 * game.zoom;
        if (cell.prop === 'tree') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(pos.x - 2.5 * game.zoom, pos.y + th * 0.25, 5 * game.zoom, 10 * game.zoom);
          ctx.beginPath();
          ctx.arc(pos.x + sway, pos.y + th * 0.15, 10 * game.zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#15803d';
          ctx.fill();
        } else if (cell.prop === 'rock') {
          drawIsoPrism(pos.x, pos.y - 4 * game.zoom, tw * 0.34, th * 0.34, 8 * game.zoom, '#cbd5e1', '#94a3b8', '#64748b', null);
        } else if (cell.prop === 'flower') {
          ctx.beginPath();
          ctx.arc(pos.x - 5 * game.zoom, pos.y + th * 0.45, 3.2 * game.zoom, 0, Math.PI * 2);
          ctx.arc(pos.x + 5 * game.zoom, pos.y + th * 0.55, 3.2 * game.zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
        }
      }

      if (cell.unlocked && cell.building) {
        const b = cell.building;
        if (b.id === 'ods11') tramCount++;
        const isHouse = b.id === 'house_eco';

        drawContactShadow(pos.x, pos.y, tw * 0.9, th * 0.9);
        const bw = tw * (isHouse ? 0.64 : 0.58);
        const bh = th * (isHouse ? 0.64 : 0.58);
        const bDepth = (isHouse ? 24 : 22) * game.zoom;
        const bTopY = pos.y + (th - bh) * 0.5 - bDepth;

        drawIsoPrism(pos.x, bTopY, bw, bh, bDepth, b.roof || '#f8fafc', b.color, shadeHex(b.color, -24), 'rgba(255,255,255,0.45)');

        if (isHouse && isNight) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(pos.x - 5 * game.zoom, bTopY + bDepth * 0.45, 4 * game.zoom, 4 * game.zoom);
          ctx.fillRect(pos.x + 2 * game.zoom, bTopY + bDepth * 0.45, 4 * game.zoom, 4 * game.zoom);
        }

        if (b.id === 'ods13') {
          const hubX = pos.x;
          const hubY = bTopY - 8 * game.zoom;
          const bladeLen = 13 * game.zoom;
          const rot = Date.now() * 0.0045 + r + c;

          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 2 * game.zoom);
          ctx.lineCap = 'round';
          for (let k = 0; k < 3; k++) {
            const a = rot + (k * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(hubX, hubY);
            ctx.lineTo(hubX + Math.cos(a) * bladeLen, hubY + Math.sin(a) * bladeLen);
            ctx.stroke();
          }
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(hubX, hubY, 2.2 * game.zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (b.id === 'ods17' && isNight) {
          const beamX = pos.x;
          const beamY = bTopY - 5 * game.zoom;
          const beamAngle = Date.now() * 0.002 + r;
          const beamLen = 58 * game.zoom;

          ctx.save();
          ctx.translate(beamX, beamY);
          ctx.rotate(beamAngle);
          const beamGrad = ctx.createLinearGradient(0, 0, beamLen, 0);
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(beamLen, -14 * game.zoom);
          ctx.lineTo(beamLen, 14 * game.zoom);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.font = `${Math.round(17 * game.zoom)}px "Fredoka", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const bob = Math.sin(Date.now() * 0.004 + r * 1.3 + c) * 2.5 * game.zoom;
        ctx.fillText(b.emoji, pos.x, bTopY - 4 * game.zoom + bob);
      }
    }
  }

  updateWalkers();
  ctx.font = `${Math.round(13 * game.zoom)}px "Fredoka", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const w of game.walkers) {
    const cA = game.grid[w.r]?.[w.c];
    const cB = game.grid[w.targetR]?.[w.targetC];
    if (!cA || !cB || !cA.unlocked || !cB.unlocked) continue;
    const pA = gridToScreen(w.r, w.c, cA.elevation);
    const pB = gridToScreen(w.targetR, w.targetC, cB.elevation);
    const wx = pA.x + (pB.x - pA.x) * w.progress;
    const wy = pA.y + (pB.y - pA.y) * w.progress + th * 0.45 - Math.abs(Math.sin(w.progress * Math.PI * 4)) * 3 * game.zoom;
    ctx.fillText(w.emoji, wx, wy);
  }

  if (tramCount > 0) {
    const loopT = (Date.now() * 0.00035) % 1;
    const angle = loopT * Math.PI * 2;
    const rad = Math.max(1.5, game.islandRadius * 0.65);
    const trR = CENTER + Math.sin(angle) * rad;
    const trC = CENTER + Math.cos(angle) * rad;
    const tPos = gridToScreen(trR, trC, 1.5);
    ctx.font = `${Math.round(16 * game.zoom)}px "Fredoka", sans-serif`;
    ctx.fillText('🚊', tPos.x, tPos.y + th * 0.35);
  }

  if (light < 0.92) {
    ctx.fillStyle = isNight
      ? `rgba(15, 23, 42, ${(1 - light) * 0.45})`
      : `rgba(251, 146, 60, ${(1 - light) * 0.16})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  updateAndDrawEffects();
}

function shadeHex(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 1.2 + Math.random() * 2.2;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 1,
      color
    });
  }
}

function spawnFloatingText(x, y, text, color = '#ffffff') {
  game.floatingTexts.push({
    x,
    y,
    text,
    color,
    life: 1
  });
}

function updateAndDrawEffects() {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;
    p.life -= 0.03;
    if (p.life <= 0) {
      game.particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 * game.zoom, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
    const ft = game.floatingTexts[i];
    ft.y -= 0.9;
    ft.life -= 0.02;
    if (ft.life <= 0) {
      game.floatingTexts.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.font = '700 13px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }
}