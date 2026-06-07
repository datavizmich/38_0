const FORMATIONS = {
  "4-3-3": ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
  "4-2-3-1": ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "LW", "ST", "RW"],
  "3-5-2": ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "CM", "RM", "ST", "ST"],
};

const POSITION_ALIASES = {
  GK: ["GK"],
  LB: ["LB", "LWB"],
  CB: ["CB"],
  RB: ["RB", "RWB"],
  CDM: ["CDM", "CM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM", "ST"],
  LW: ["LW", "LM", "RW"],
  RW: ["RW", "RM", "LW"],
  ST: ["ST", "CF", "CAM"],
  LM: ["LM", "LW", "CM"],
  RM: ["RM", "RW", "CM"],
};

const POSITION_ORDER = {
  GK: 0,
  LB: 1,
  LWB: 1,
  CB: 2,
  RB: 3,
  RWB: 3,
  CDM: 4,
  CM: 5,
  CAM: 6,
  LM: 7,
  RM: 8,
  LW: 9,
  RW: 10,
  ST: 11,
  CF: 11,
};

const FORMATION_LAYOUTS = {
  "4-3-3": [
    { row: 5, col: 3 },
    { row: 4, col: 1 },
    { row: 4, col: 2 },
    { row: 4, col: 4 },
    { row: 4, col: 5 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
    { row: 3, col: 5 },
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 1, col: 5 },
  ],
  "4-2-3-1": [
    { row: 5, col: 3 },
    { row: 4, col: 1 },
    { row: 4, col: 2 },
    { row: 4, col: 4 },
    { row: 4, col: 5 },
    { row: 3, col: 2 },
    { row: 3, col: 4 },
    { row: 2, col: 3 },
    { row: 2, col: 1 },
    { row: 1, col: 3 },
    { row: 2, col: 5 },
  ],
  "3-5-2": [
    { row: 5, col: 3 },
    { row: 4, col: 2 },
    { row: 4, col: 3 },
    { row: 4, col: 4 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    { row: 3, col: 5 },
    { row: 1, col: 2 },
    { row: 1, col: 4 },
  ],
};

const state = {
  data: null,
  teams: [],
  view: "home",
  formation: "4-3-3",
  mode: "classic",
  currentTeam: null,
  lineup: new Map(),
  selectedPlayerId: null,
};

let els = null;

function bindElements() {
  els = {
    totalPlayers: document.querySelector("[data-total-players]"),
    totalTeams: document.querySelector("[data-total-teams]"),
    homeView: document.querySelector("[data-home-view]"),
    gameView: document.querySelector("[data-game-view]"),
    homeFormation: document.querySelector("[data-home-formation]"),
    homeMode: document.querySelector("[data-home-mode]"),
    playGame: document.querySelector("[data-play-game]"),
    backHome: document.querySelector("[data-back-home]"),
    gameFormation: document.querySelector("[data-game-formation]"),
    gameMode: document.querySelector("[data-game-mode]"),
    currentTeam: document.querySelector("[data-current-team]"),
    currentFormation: document.querySelector("[data-current-formation]"),
    rosterTitle: document.querySelector("[data-roster-title]"),
    rosterSummary: document.querySelector("[data-roster-summary]"),
    rosterGrid: document.querySelector("[data-roster-grid]"),
    formationTitle: document.querySelector("[data-formation-title]"),
    pitch: document.querySelector("[data-pitch]"),
    rollTeam: document.querySelector("[data-roll-team]"),
  };

  const missing = Object.entries(els)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing required DOM nodes: ${missing.join(", ")}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizePositions(player) {
  return new Set([player.position, ...(player.altPositions || [])].filter(Boolean));
}

function teamPlayers(team) {
  return state.data.players.filter((player) => player.team === team);
}

function positionRank(position) {
  return POSITION_ORDER[position] ?? 99;
}

function rosterComparator(a, b) {
  return positionRank(a.position) - positionRank(b.position) || a.name.localeCompare(b.name);
}

function playerCanPlaySlot(player, slot) {
  const aliases = POSITION_ALIASES[slot] || [slot];
  const positions = normalizePositions(player);
  return aliases.some((alias) => positions.has(alias));
}

function usedSlotIndices() {
  return new Set(state.lineup.keys());
}

function availableSlotsForPlayer(player) {
  const occupied = usedSlotIndices();
  return FORMATIONS[state.formation].flatMap((slot, index) => {
    if (occupied.has(index)) return [];
    return playerCanPlaySlot(player, slot) ? [index] : [];
  });
}

function playerIsAvailable(player) {
  return availableSlotsForPlayer(player).length > 0;
}

function selectedPlayer() {
  if (!state.selectedPlayerId) return null;
  return state.data.players.find((player) => player.id === state.selectedPlayerId) ?? null;
}

function getSurname(player) {
  const parts = String(player.name).trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(player.name);
}

function getPlayerBubbleLabel(player) {
  return getSurname(player);
}

function renderStats() {
  els.totalPlayers.textContent = state.data.players.length.toLocaleString();
  els.totalTeams.textContent = state.teams.length.toString();
}

function renderHomeSetup() {
  els.homeFormation.innerHTML = Object.keys(FORMATIONS)
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  els.homeFormation.value = state.formation;
  els.homeMode.value = state.mode;
}

function renderView() {
  const home = state.view === "home";
  els.homeView.hidden = !home;
  els.gameView.hidden = home;
  document.body.dataset.view = state.view;
}

function renderGameMeta() {
  els.gameFormation.textContent = state.formation;
  els.gameMode.textContent = state.mode === "classic" ? "Classic" : "Memory";
  els.currentFormation.textContent = state.formation;
}

function renderRoster() {
  const players = state.currentTeam ? teamPlayers(state.currentTeam) : [];
  const selected = selectedPlayer();

  els.rosterTitle.textContent = state.currentTeam ?? "No club rolled yet";
  els.rosterSummary.textContent = state.currentTeam
    ? state.selectedPlayerId
      ? `Selected: ${selected?.name ?? "Unknown"}. Lock them, then reroll for the next player.`
      : `${players.length} players available. Click one player, then a valid slot.`
    : state.lineup.size
      ? "Player locked. Reroll to pick the next team."
      : "Roll a team to see the available players.";

  if (!players.length) {
    els.rosterGrid.innerHTML = `
      <div class="roster-empty">
        ${state.lineup.size ? "Player locked. Roll another team to continue." : "Roll a team to begin."}
      </div>
    `;
    return;
  }

  const rostered = [...players].sort(rosterComparator);
  els.rosterGrid.innerHTML = rostered
    .map((player) => {
      const isSelected = state.selectedPlayerId === player.id;
      const unavailable = !playerIsAvailable(player) && !isSelected;
      return `
        <button
          class="player-card ${isSelected ? "selected" : ""} ${unavailable ? "unavailable" : ""}"
          data-player-id="${player.id}"
          type="button"
          ${unavailable ? "disabled" : ""}
          title="${unavailable ? "No open slot for this player in the current formation" : ""}"
        >
          <span class="player-name">${escapeHtml(player.name)}</span>
          <span class="player-meta">${escapeHtml(player.position)} · ${player.ovr}</span>
        </button>
      `;
    })
    .join("");

  els.rosterGrid.querySelectorAll("[data-player-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = Number(button.dataset.playerId);
      state.selectedPlayerId = state.selectedPlayerId === playerId ? null : playerId;
      renderRoster();
      renderPitch();
    });
  });
}

function renderPitch() {
  const formation = FORMATIONS[state.formation];
  const selected = selectedPlayer();

  els.formationTitle.textContent = state.formation;

  els.pitch.innerHTML = `
    <div class="pitch-grid">
      ${formation
        .map((slot, index) => {
          const lockedPlayer = state.lineup.get(index) ?? null;
          const canAcceptSelected = selected ? playerCanPlaySlot(selected, slot) : false;
          const canBeClicked = Boolean(selected && canAcceptSelected);
          const layout = FORMATION_LAYOUTS[state.formation][index];
          return `
            <button
              class="slot ${lockedPlayer ? "filled" : "empty"} ${canBeClicked ? "target" : ""}"
              type="button"
              data-slot-index="${index}"
              style="grid-row: ${layout.row}; grid-column: ${layout.col};"
              ${canBeClicked ? "" : "disabled"}
            >
              <span class="slot-label">${slot}</span>
              ${lockedPlayer ? `<span class="slot-bubble" aria-hidden="true" title="${escapeHtml(lockedPlayer.name)}">${escapeHtml(getPlayerBubbleLabel(lockedPlayer))}</span>` : ""}
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  els.pitch.querySelectorAll("[data-slot-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const slotIndex = Number(button.dataset.slotIndex);
      const slot = FORMATIONS[state.formation][slotIndex];
      const player = selectedPlayer();
      if (!player) return;
      if (!playerCanPlaySlot(player, slot)) return;

      for (const [otherIndex, otherPlayer] of [...state.lineup.entries()]) {
        if (otherPlayer.id === player.id || otherIndex === slotIndex) {
          state.lineup.delete(otherIndex);
        }
      }

      state.lineup.set(slotIndex, player);
      state.selectedPlayerId = null;
      state.currentTeam = null;
      renderRoster();
      renderPitch();
    });
  });
}

function renderAll() {
  renderStats();
  renderHomeSetup();
  renderGameMeta();
  renderView();
  renderRoster();
  renderPitch();
}

function rollTeam() {
  if (!state.teams.length) return;
  state.currentTeam = state.teams[Math.floor(Math.random() * state.teams.length)];
  state.selectedPlayerId = null;
  renderAll();
}

function startGame() {
  state.formation = els.homeFormation.value;
  state.mode = els.homeMode.value;
  state.view = "game";
  state.currentTeam = null;
  state.lineup.clear();
  state.selectedPlayerId = null;
  window.location.hash = "game";
  renderAll();
}

function goHome() {
  state.view = "home";
  window.location.hash = "";
  renderAll();
}

function wireHomeControls() {
  els.playGame.addEventListener("click", startGame);
  els.backHome.addEventListener("click", goHome);
  els.rollTeam.addEventListener("click", rollTeam);

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#game") {
      state.view = "game";
    } else {
      state.view = "home";
    }
    renderAll();
  });

  els.homeFormation.addEventListener("change", () => {
    state.formation = els.homeFormation.value;
    renderGameMeta();
  });

  els.homeMode.addEventListener("change", () => {
    state.mode = els.homeMode.value;
    renderGameMeta();
  });
}

async function init() {
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  bindElements();

  const response = await fetch("./data/premier-league-players.json");
  if (!response.ok) {
    throw new Error(`Failed to load player data: ${response.status}`);
  }

  state.data = await response.json();
  state.teams = [...new Set(state.data.players.map((player) => player.team))].sort((a, b) => a.localeCompare(b));

  wireHomeControls();

  if (window.location.hash === "#game") {
    state.view = "game";
  }

  renderAll();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `
    <main style="padding:2rem;color:#fff;font-family:system-ui,sans-serif">
      <h1>Failed to boot the site</h1>
      <p>${escapeHtml(error.message)}</p>
      <p>Make sure <code>site/data/premier-league-players.json</code> has been generated.</p>
    </main>
  `;
});
