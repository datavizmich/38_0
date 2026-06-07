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

const state = {
  data: null,
  teams: [],
  currentTeam: null,
  formation: "4-3-3",
  lineup: new Map(),
  selectedPlayerId: null,
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

let els = null;

function bindElements() {
  els = {
    totalPlayers: document.querySelector("[data-total-players]"),
    totalTeams: document.querySelector("[data-total-teams]"),
    currentTeam: document.querySelector("[data-current-team]"),
    formationSelect: document.querySelector("[data-formation]"),
    rollTeam: document.querySelector("[data-roll-team]"),
    rosterTitle: document.querySelector("[data-roster-title]"),
    rosterSummary: document.querySelector("[data-roster-summary]"),
    rosterGrid: document.querySelector("[data-roster-grid]"),
    formationTitle: document.querySelector("[data-formation-title]"),
    pitch: document.querySelector("[data-pitch]"),
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

function playerComparator(a, b) {
  return b.ovr - a.ovr || a.name.localeCompare(b.name);
}

function playerCanPlaySlot(player, slot) {
  const aliases = POSITION_ALIASES[slot] || [slot];
  const positions = normalizePositions(player);
  return aliases.some((alias) => positions.has(alias));
}

function candidatesForSlot(players, slot, excludedIds = new Set()) {
  const eligible = players.filter((player) => !excludedIds.has(player.id) && playerCanPlaySlot(player, slot));
  if (eligible.length) return [...eligible].sort(playerComparator);

  const unused = players.filter((player) => !excludedIds.has(player.id));
  if (unused.length) return [...unused].sort(playerComparator);

  return [...players].sort(playerComparator);
}

function explicitIdsExcluding(slotIndex) {
  return new Set(
    [...state.lineup.entries()]
      .filter(([index]) => index !== slotIndex)
      .map(([, player]) => player.id)
  );
}

function selectedPlayer() {
  if (!state.selectedPlayerId) return null;
  return state.data.players.find((player) => player.id === state.selectedPlayerId) ?? null;
}

function renderStats() {
  els.totalPlayers.textContent = state.data.players.length.toLocaleString();
  els.totalTeams.textContent = state.teams.length.toString();
  els.currentTeam.textContent = state.currentTeam ?? "Roll a team";
}

function renderFormationSelect() {
  els.formationSelect.innerHTML = Object.keys(FORMATIONS)
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  els.formationSelect.value = state.formation;
}

function renderRoster() {
  const players = state.currentTeam ? teamPlayers(state.currentTeam) : [];
  const selected = selectedPlayer();

  els.rosterTitle.textContent = state.currentTeam ?? "No club rolled yet";
  els.rosterSummary.textContent = state.currentTeam
    ? state.selectedPlayerId
      ? `Selected: ${selected?.name ?? "Unknown"}. Click a valid position on the pitch to lock them in.`
      : `${players.length} players available for this club. Click one to select it.`
    : "Roll a team to see the available players.";

  if (!players.length) {
    els.rosterGrid.innerHTML = `
      <div class="player-card empty-card">
        <div class="name">Ready to roll</div>
        <div class="detail">The team you roll will appear here. Click a player to arm them for the pitch.</div>
      </div>
    `;
    return;
  }

  const ranked = [...players].sort(playerComparator);
  els.rosterGrid.innerHTML = ranked
    .map((player) => {
      const isSelected = state.selectedPlayerId === player.id;
      return `
        <button class="player-card ${isSelected ? "selected" : ""}" data-player-id="${player.id}" type="button">
          <div class="topline">
            <div>
              <div class="name">${escapeHtml(player.name)}</div>
              <div class="detail">${escapeHtml(player.position)} · ${escapeHtml(player.nation)} · ${player.age ?? "?"} yo</div>
            </div>
            <span class="chip accent">${player.ovr}</span>
          </div>
          <div class="meta">
            <span class="chip">${player.pac ?? "-"} PAC</span>
            <span class="chip">${player.sho ?? "-"} SHO</span>
            <span class="chip">${player.pas ?? "-"} PAS</span>
            <span class="chip">${player.dri ?? "-"} DRI</span>
            <span class="chip">${player.def ?? "-"} DEF</span>
            <span class="chip">${player.phy ?? "-"} PHY</span>
          </div>
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
          const isExplicit = state.lineup.has(index);
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
              <div class="slot-label">
                <span>${slot}</span>
                <span>${index + 1}/${formation.length}</span>
              </div>
              <div class="player">${lockedPlayer ? escapeHtml(lockedPlayer.name) : "Empty slot"}</div>
              <div class="detail">
                ${lockedPlayer ? `${escapeHtml(lockedPlayer.position)} · ${lockedPlayer.ovr} OVR` : selected ? "Valid target" : "Select a player"}
              </div>
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
      renderRoster();
      renderPitch();
    });
  });
}

function renderAll() {
  renderStats();
  renderRoster();
  renderPitch();
}

function rollTeam() {
  if (!state.teams.length) return;
  state.currentTeam = state.teams[Math.floor(Math.random() * state.teams.length)];
  state.selectedPlayerId = null;
  renderAll();
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

  renderFormationSelect();
  renderAll();

  els.formationSelect.addEventListener("change", () => {
    state.formation = els.formationSelect.value;
    state.lineup.clear();
    state.selectedPlayerId = null;
    renderAll();
  });

  els.rollTeam.addEventListener("click", rollTeam);
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
