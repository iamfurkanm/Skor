const PLAYERS = ['Zeynel', 'Ömer', 'Furkan'];
const PAIRS = [
  ['Zeynel', 'Ömer'],
  ['Zeynel', 'Furkan'],
  ['Ömer', 'Furkan'],
];
const API_URL = '/api/matches';

const state = {
  selectedPlayers: [],
  selectedGame: null,
  matches: [],
  serverOnline: false,
  penaltyMode: false,
  penaltyWinner: null,
};

const playersGrid = document.getElementById('players-grid');
const btnToGame = document.getElementById('btn-to-game');
const btnToScore = document.getElementById('btn-to-score');
const btnSaveMatch = document.getElementById('btn-save-match');
const btnBackToPlayers = document.getElementById('btn-back-to-players');
const btnBackToGame = document.getElementById('btn-back-to-game');
const matchupHint = document.getElementById('matchup-hint');
const scoreHint = document.getElementById('score-hint');
const scoreP1Name = document.getElementById('score-p1-name');
const scoreP2Name = document.getElementById('score-p2-name');
const scoreP1 = document.getElementById('score-p1');
const scoreP2 = document.getElementById('score-p2');
const penaltySection = document.getElementById('penalty-section');
const penaltyIntro = document.getElementById('penalty-intro');
const penaltyPicker = document.getElementById('penalty-picker');
const penaltyPlayers = document.getElementById('penalty-players');
const penaltyConfirmed = document.getElementById('penalty-confirmed');
const penaltyConfirmedText = document.getElementById('penalty-confirmed-text');
const btnTogglePenalty = document.getElementById('btn-toggle-penalty');
const btnCancelPenalty = document.getElementById('btn-cancel-penalty');
const btnChangePenalty = document.getElementById('btn-change-penalty');
const generalBoard = document.getElementById('general-board');
const pesBoard = document.getElementById('pes-board');
const fifaBoard = document.getElementById('fifa-board');
const playerDetails = document.getElementById('player-details');
const matchList = document.getElementById('match-list');
const saveIndicator = document.getElementById('save-indicator');
const toast = document.getElementById('toast');
const btnBackup = document.getElementById('btn-backup');
const btnReload = document.getElementById('btn-reload');
const restoreInput = document.getElementById('restore-input');
const serverBanner = document.getElementById('server-banner');

init();

async function init() {
  await loadMatches();
  renderAllBoards();
  renderMatchList();
  bindEvents();
}

function bindEvents() {
  playersGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.player-card');
    if (!card) return;
    togglePlayer(card.dataset.player);
  });

  document.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => selectGame(card.dataset.game));
  });

  btnToGame.addEventListener('click', () => goToStep(2));
  btnToScore.addEventListener('click', () => goToStep(3));
  btnBackToPlayers.addEventListener('click', () => goToStep(1));
  btnBackToGame.addEventListener('click', () => goToStep(2));
  btnSaveMatch.addEventListener('click', saveMatch);

  document.querySelectorAll('.score-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.dataset.target === 'p1' ? scoreP1 : scoreP2;
      let val = parseInt(input.value, 10) || 0;
      if (btn.dataset.action === 'plus') val++;
      else if (val > 0) val--;
      input.value = val;
      updatePenaltyUI();
    });
  });

  [scoreP1, scoreP2].forEach((input) => {
    input.addEventListener('input', () => {
      if (input.value < 0) input.value = 0;
      updatePenaltyUI();
    });
  });

  btnTogglePenalty.addEventListener('click', () => {
    state.penaltyMode = true;
    renderPenaltyPicker();
    updatePenaltyUI();
  });

  btnCancelPenalty.addEventListener('click', resetPenaltyState);
  btnChangePenalty.addEventListener('click', () => {
    state.penaltyWinner = null;
    state.penaltyMode = true;
    renderPenaltyPicker();
    updatePenaltyUI();
  });

  btnBackup.addEventListener('click', downloadBackup);
  btnReload.addEventListener('click', reloadFromFile);
  restoreInput.addEventListener('change', restoreBackup);
}

function togglePlayer(name) {
  const idx = state.selectedPlayers.indexOf(name);
  if (idx >= 0) {
    state.selectedPlayers.splice(idx, 1);
  } else if (state.selectedPlayers.length < 2) {
    state.selectedPlayers.push(name);
  }

  document.querySelectorAll('.player-card').forEach((card) => {
    card.classList.toggle('selected', state.selectedPlayers.includes(card.dataset.player));
  });

  btnToGame.disabled = state.selectedPlayers.length !== 2;
}

function selectGame(game) {
  state.selectedGame = game;
  document.querySelectorAll('.game-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.game === game);
  });
  btnToScore.disabled = !game;
}

function goToStep(step) {
  document.querySelectorAll('.step-content').forEach((el) => el.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  document.querySelectorAll('.step').forEach((el) => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.remove('active', 'done');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('done');
  });

  if (step === 2) {
    matchupHint.textContent = `${state.selectedPlayers[0]} vs ${state.selectedPlayers[1]}`;
  }

  if (step === 3) {
    scoreP1Name.textContent = state.selectedPlayers[0];
    scoreP2Name.textContent = state.selectedPlayers[1];
    scoreHint.textContent = `${state.selectedGame} — ${state.selectedPlayers[0]} vs ${state.selectedPlayers[1]}`;
    scoreP1.value = 0;
    scoreP2.value = 0;
    resetPenaltyState();
    updatePenaltyUI();
  }
}

function resetPenaltyState() {
  state.penaltyMode = false;
  state.penaltyWinner = null;
}

function isDrawScore() {
  const s1 = parseInt(scoreP1.value, 10) || 0;
  const s2 = parseInt(scoreP2.value, 10) || 0;
  return s1 === s2;
}

function renderPenaltyPicker() {
  penaltyPlayers.innerHTML = state.selectedPlayers
    .map((p) => `<button type="button" class="penalty-player-btn" data-player="${p}">${p}</button>`)
    .join('');

  penaltyPlayers.querySelectorAll('.penalty-player-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.penaltyWinner = btn.dataset.player;
      state.penaltyMode = false;
      updatePenaltyUI();
    });
  });
}

function updatePenaltyUI() {
  const isDraw = isDrawScore();

  if (!isDraw) {
    resetPenaltyState();
    penaltySection.classList.add('hidden');
    return;
  }

  penaltySection.classList.remove('hidden');

  if (state.penaltyWinner) {
    penaltyIntro.classList.add('hidden');
    penaltyPicker.classList.add('hidden');
    penaltyConfirmed.classList.remove('hidden');
    penaltyConfirmedText.textContent = `${state.penaltyWinner} penaltılarla kazandı`;
    return;
  }

  penaltyConfirmed.classList.add('hidden');

  if (state.penaltyMode) {
    penaltyIntro.classList.add('hidden');
    penaltyPicker.classList.remove('hidden');
    penaltyPlayers.querySelectorAll('.penalty-player-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.player === state.penaltyWinner);
    });
  } else {
    penaltyIntro.classList.remove('hidden');
    penaltyPicker.classList.add('hidden');
  }
}

function getMatchResult(m) {
  const { player1, player2, score1, score2, penaltyWinner, penalties } = m;

  if (penalties && penaltyWinner) {
    const loser = penaltyWinner === player1 ? player2 : player1;
    return { winner: penaltyWinner, loser, isDraw: false, isPenalty: true };
  }
  if (score1 === score2) {
    return { winner: null, loser: null, isDraw: true, isPenalty: false };
  }
  const winner = score1 > score2 ? player1 : player2;
  const loser = score1 > score2 ? player2 : player1;
  return { winner, loser, isDraw: false, isPenalty: false };
}

function formatMatchScore(m) {
  const base = `${m.player1} ${m.score1} - ${m.score2} ${m.player2}`;
  if (m.penalties && m.penaltyWinner) {
    return `${base} <span class="match-pen">(Pen: ${m.penaltyWinner})</span>`;
  }
  return base;
}

function saveMatch() {
  const s1 = parseInt(scoreP1.value, 10) || 0;
  const s2 = parseInt(scoreP2.value, 10) || 0;

  const match = {
    id: Date.now(),
    player1: state.selectedPlayers[0],
    player2: state.selectedPlayers[1],
    game: state.selectedGame,
    score1: s1,
    score2: s2,
    date: new Date().toISOString(),
  };

  if (s1 === s2 && state.penaltyWinner) {
    match.penalties = true;
    match.penaltyWinner = state.penaltyWinner;
  }

  state.matches.unshift(match);
  persistMatches().then(() => {
    renderAllBoards();
    renderMatchList();
    showToast(match.penalties ? 'Maç kaydedildi (penaltılar)!' : 'Maç kaydedildi!');

    state.selectedPlayers = [];
    state.selectedGame = null;
    resetPenaltyState();
    document.querySelectorAll('.player-card').forEach((c) => c.classList.remove('selected'));
    document.querySelectorAll('.game-card').forEach((c) => c.classList.remove('selected'));
    btnToGame.disabled = true;
    btnToScore.disabled = true;
    goToStep(1);
  }).catch(() => showToast('Kayıt başarısız — bağlantıyı kontrol edin'));
}

function filterMatches(game) {
  if (!game) return state.matches;
  return state.matches.filter((m) => m.game === game);
}

function initPlayerStats() {
  const stats = {};
  PLAYERS.forEach((p) => {
    stats[p] = {
      wins: 0,
      losses: 0,
      draws: 0,
      penaltyWins: 0,
      penaltyLosses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      matches: 0,
      h2h: {},
    };
    PLAYERS.filter((o) => o !== p).forEach((o) => {
      stats[p].h2h[o] = {
        wins: 0,
        losses: 0,
        draws: 0,
        penaltyWins: 0,
        penaltyLosses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        matches: 0,
      };
    });
  });
  return stats;
}

function initPairStats() {
  const stats = {};
  PAIRS.forEach(([p1, p2]) => {
    const key = pairKey(p1, p2);
    stats[key] = {
      players: [p1, p2],
      wins: { [p1]: 0, [p2]: 0 },
      draws: 0,
      penalties: 0,
      total: 0,
      goals: { [p1]: 0, [p2]: 0 },
    };
  });
  return stats;
}

function pairKey(p1, p2) {
  return [p1, p2].sort().join(' vs ');
}

function computePlayerStats(matches) {
  const stats = initPlayerStats();

  matches.forEach((m) => {
    const { player1: p1, player2: p2, score1: s1, score2: s2 } = m;
    const result = getMatchResult(m);

    [p1, p2].forEach((p, i) => {
      const opp = i === 0 ? p2 : p1;
      const gf = i === 0 ? s1 : s2;
      const ga = i === 0 ? s2 : s1;

      stats[p].matches++;
      stats[p].goalsFor += gf;
      stats[p].goalsAgainst += ga;
      stats[p].h2h[opp].matches++;
      stats[p].h2h[opp].goalsFor += gf;
      stats[p].h2h[opp].goalsAgainst += ga;

      if (result.isDraw) {
        stats[p].draws++;
        stats[p].h2h[opp].draws++;
      } else if (result.winner === p) {
        stats[p].wins++;
        stats[p].h2h[opp].wins++;
        if (result.isPenalty) {
          stats[p].penaltyWins++;
          stats[p].h2h[opp].penaltyWins++;
        }
      } else {
        stats[p].losses++;
        stats[p].h2h[opp].losses++;
        if (result.isPenalty) {
          stats[p].penaltyLosses++;
          stats[p].h2h[opp].penaltyLosses++;
        }
      }
    });
  });

  return stats;
}

function computePairStats(matches) {
  const stats = initPairStats();

  matches.forEach((m) => {
    const key = pairKey(m.player1, m.player2);
    if (!stats[key]) return;

    const s = stats[key];
    s.total++;
    s.goals[m.player1] += m.score1;
    s.goals[m.player2] += m.score2;

    const result = getMatchResult(m);
    if (result.isDraw) s.draws++;
    else if (result.isPenalty) {
      s.penalties++;
      s.wins[result.winner]++;
    } else if (m.score1 > m.score2) s.wins[m.player1]++;
    else s.wins[m.player2]++;
  });

  return stats;
}

function playerInitial(name) {
  return name.charAt(0);
}

function renderLeaderboard(matches, container) {
  if (matches.length === 0) {
    container.innerHTML = '<div class="board-empty">Henüz maç yok</div>';
    return;
  }

  const stats = computePlayerStats(matches);
  const sorted = [...PLAYERS].sort((a, b) => {
    if (stats[b].wins !== stats[a].wins) return stats[b].wins - stats[a].wins;
    const diffA = stats[a].goalsFor - stats[a].goalsAgainst;
    const diffB = stats[b].goalsFor - stats[b].goalsAgainst;
    return diffB - diffA;
  });

  container.innerHTML = `
    <table class="leaderboard">
      <thead>
        <tr>
          <th>Oyuncu</th>
          <th>Maç</th>
          <th>G</th>
          <th>M</th>
          <th>B</th>
          <th>Pen G</th>
          <th>Atılan</th>
          <th>Yenilen</th>
          <th>Averaj</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map((p) => {
            const s = stats[p];
            const avg = s.goalsFor - s.goalsAgainst;
            const avgStr = avg > 0 ? `+${avg}` : `${avg}`;
            return `
              <tr>
                <td>
                  <div class="player-cell">
                    <span class="mini-avatar">${playerInitial(p)}</span>
                    ${p}
                  </div>
                </td>
                <td>${s.matches}</td>
                <td class="col-win">${s.wins}</td>
                <td class="col-loss">${s.losses}</td>
                <td class="col-draw">${s.draws}</td>
                <td class="col-pen">${s.penaltyWins}</td>
                <td class="col-gf">${s.goalsFor}</td>
                <td class="col-ga">${s.goalsAgainst}</td>
                <td>${avgStr}</td>
              </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;
}

function renderPairBoard(matches, container, game) {
  const filtered = game ? matches : matches;
  if (filtered.length === 0) {
    container.innerHTML = '<div class="board-empty">Henüz maç yok</div>';
    return;
  }

  const pairStats = computePairStats(filtered);
  const cards = PAIRS.map(([p1, p2]) => {
    const key = pairKey(p1, p2);
    const s = pairStats[key];
    if (s.total === 0) {
      return `
        <div class="pair-card">
          <div class="pair-header">
            <span class="pair-names">${p1} vs ${p2}</span>
          </div>
          <div class="board-empty" style="padding:12px;margin:0;border:none">Maç yok</div>
        </div>`;
    }

    return `
      <div class="pair-card">
        <div class="pair-header">
          <span class="pair-names">${p1} vs ${p2}</span>
          <span class="pair-total" style="margin:0">${s.total} maç</span>
        </div>
        <div class="pair-stats">
          <div class="stat-box wins">
            <span class="stat-value">${s.wins[p1]}</span>
            <span class="stat-label">${p1} G</span>
          </div>
          <div class="stat-box draws">
            <span class="stat-value">${s.draws}</span>
            <span class="stat-label">Berabere</span>
          </div>
          <div class="stat-box losses">
            <span class="stat-value">${s.wins[p2]}</span>
            <span class="stat-label">${p2} G</span>
          </div>
        </div>
        <div class="pair-goals">
          <span>${p1}: <strong>${s.goals[p1]} gol</strong></span>
          <span>${p2}: <strong>${s.goals[p2]} gol</strong></span>
        </div>
        ${s.penalties > 0 ? `<div class="pair-total">Penaltıyla: ${s.penalties} maç</div>` : ''}
      </div>`;
  });

  container.innerHTML = `<div class="pairs-grid">${cards.join('')}</div>`;
}

function renderPlayerDetails() {
  if (state.matches.length === 0) {
    playerDetails.innerHTML = '<div class="board-empty" style="grid-column:1/-1">Henüz maç yok. İlk maçınızı ekleyin!</div>';
    return;
  }

  const allStats = computePlayerStats(state.matches);
  const pesStats = computePlayerStats(filterMatches('PES'));
  const fifaStats = computePlayerStats(filterMatches('FIFA'));

  playerDetails.innerHTML = PLAYERS.map((p) => {
    const s = allStats[p];
    const opponents = PLAYERS.filter((o) => o !== p);

    const h2hHtml = opponents
      .map((opp) => {
        const h = s.h2h[opp];
        if (h.matches === 0) {
          return `
            <div class="h2h-item">
              <div class="h2h-opponent">vs ${opp}</div>
              <div class="h2h-empty">Henüz maç yok</div>
            </div>`;
        }

        const pesH = pesStats[p].h2h[opp];
        const fifaH = fifaStats[p].h2h[opp];
        const gameBreakdown = [];
        if (pesH.matches > 0) {
          const penPes = pesH.penaltyWins > 0 ? ` · Pen: ${pesH.penaltyWins}G` : '';
          gameBreakdown.push(`PES: ${pesH.wins}G-${pesH.losses}M-${pesH.draws}B${penPes} · ${pesH.goalsFor}-${pesH.goalsAgainst} gol`);
        }
        if (fifaH.matches > 0) {
          const penFifa = fifaH.penaltyWins > 0 ? ` · Pen: ${fifaH.penaltyWins}G` : '';
          gameBreakdown.push(`FIFA: ${fifaH.wins}G-${fifaH.losses}M-${fifaH.draws}B${penFifa} · ${fifaH.goalsFor}-${fifaH.goalsAgainst} gol`);
        }

        return `
          <div class="h2h-item">
            <div class="h2h-opponent">vs ${opp} <span style="color:var(--text-muted);font-weight:400">(${h.matches} maç)</span></div>
            <div class="h2h-stats">
              <span>Galibiyet: <strong>${h.wins}</strong></span>
              <span>Mağlubiyet: <strong>${h.losses}</strong></span>
              <span>Atılan gol: <strong>${h.goalsFor}</strong></span>
              <span>Yenilen gol: <strong>${h.goalsAgainst}</strong></span>
              ${h.penaltyWins > 0 ? `<span>Pen. galibiyet: <strong>${h.penaltyWins}</strong></span>` : ''}
              ${h.penaltyLosses > 0 ? `<span>Pen. mağlubiyet: <strong>${h.penaltyLosses}</strong></span>` : ''}
            </div>
            ${gameBreakdown.length ? `<div style="margin-top:6px;font-size:0.7rem;color:var(--text-muted)">${gameBreakdown.join(' · ')}</div>` : ''}
          </div>`;
      })
      .join('');

    return `
      <div class="player-detail-card">
        <div class="player-detail-header">
          <span class="player-avatar">${playerInitial(p)}</span>
          <span class="player-detail-name">${p}</span>
        </div>
        <div class="player-summary">
          <div class="summary-item">
            <span class="summary-value col-win">${s.wins}</span>
            <span class="summary-label">Galibiyet</span>
          </div>
          <div class="summary-item">
            <span class="summary-value col-loss">${s.losses}</span>
            <span class="summary-label">Mağlubiyet</span>
          </div>
          <div class="summary-item">
            <span class="summary-value col-draw">${s.draws}</span>
            <span class="summary-label">Berabere</span>
          </div>
        </div>
        <div class="goals-summary">
          <div class="gf">
            <strong>${s.goalsFor}</strong>
            Atılan Gol
          </div>
          <div class="ga">
            <strong>${s.goalsAgainst}</strong>
            Yenilen Gol
          </div>
          <div>
            <strong class="col-pen">${s.penaltyWins}</strong>
            Pen. Galibiyet
          </div>
        </div>
        <div class="h2h-list">${h2hHtml}</div>
      </div>`;
  }).join('');
}

function renderAllBoards() {
  renderLeaderboard(state.matches, generalBoard);
  renderPairBoard(filterMatches('PES'), pesBoard, 'PES');
  renderPairBoard(filterMatches('FIFA'), fifaBoard, 'FIFA');
  renderPlayerDetails();
}

function renderMatchList() {
  if (state.matches.length === 0) {
    matchList.innerHTML = '<li class="match-item" style="justify-content:center;color:var(--text-muted)">Maç yok</li>';
    return;
  }

  matchList.innerHTML = state.matches
    .slice(0, 20)
    .map((m) => {
      const date = new Date(m.date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `
        <li class="match-item">
          <div class="match-info">
            <span class="match-players">${formatMatchScore(m)}</span>
            <span class="match-meta">${m.game} · ${date}</span>
          </div>
          <button class="match-delete" data-id="${m.id}" title="Sil">✕</button>
        </li>`;
    })
    .join('');

  matchList.querySelectorAll('.match-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteMatch(parseInt(btn.dataset.id, 10)));
  });
}

function deleteMatch(id) {
  if (!confirm('Bu maçı silmek istediğinize emin misiniz?')) return;
  state.matches = state.matches.filter((m) => m.id !== id);
  persistMatches().then(() => {
    renderAllBoards();
    renderMatchList();
    showToast('Maç silindi');
  }).catch(() => showToast('Silme başarısız — bağlantıyı kontrol edin'));
}

function setServerStatus(online) {
  state.serverOnline = online;
  serverBanner.classList.toggle('hidden', online);
}

async function loadMatches() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Sunucu hatası');
    const data = await res.json();
    state.matches = Array.isArray(data) ? data : (data.matches || []);
    setServerStatus(true);
  } catch {
    setServerStatus(false);
    state.matches = [];
  }
}

async function persistMatches() {
  const payload = { version: 1, matches: state.matches };
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Kayıt başarısız');
  setServerStatus(true);
  flashSaveIndicator();
}

async function reloadFromFile() {
  try {
    await loadMatches();
    renderAllBoards();
    renderMatchList();
    showToast('Veriler yenilendi!');
  } catch {
    showToast('Yenileme başarısız');
  }
}

function flashSaveIndicator() {
  saveIndicator.classList.add('visible');
  setTimeout(() => saveIndicator.classList.remove('visible'), 2000);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function downloadBackup() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    matches: state.matches,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `skorlar-yedek-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Yedek indirildi!');
}

function restoreBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const matches = data.matches || data;
      if (!Array.isArray(matches)) throw new Error('Geçersiz format');

      if (state.matches.length > 0 && !confirm('Mevcut verilerin üzerine yazılacak. Devam edilsin mi?')) {
        restoreInput.value = '';
        return;
      }

      state.matches = matches;
      await persistMatches();
      renderAllBoards();
      renderMatchList();
      showToast('Yedek geri yüklendi!');
    } catch {
      showToast('Yedek dosyası okunamadı!');
    }
    restoreInput.value = '';
  };
  reader.readAsText(file);
}
