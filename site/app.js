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
};

const els = {
  totalPlayers: document.querySelector("[data-total-players]"),
  totalTeams: document.querySelector("[data-total-teams]"),
  currentTeam: document.querySelector("[data-current-team]"),
  formationSelect: document.querySelector("[data-formation]"),
  rollTeam: document.querySelector("[data-roll-team]"),
  randomizeLineup: document.querySelector("[data-randomize-lineup]"),
  rosterTitle: document.querySelector("[data-roster-title]"),
  rosterSummary: document.querySelector("[data-roster-summary]"),
  rosterGrid: document.querySelector("[data-roster-grid]"),
  formationTitle: document.querySelector("[data-formation-title]"),
  pitch: document.querySelector("[data-pitch]"),
};

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

function candidatesForSlot(players, slot, excludedIds = new Set()) {
  const aliases = POSITION_ALIASES[slot] || [slot];
  const eligible = players.filter((player) => {
    if (excludedIds.has(player.id)) return false;
    const positions = normalizePositions(player);
    return aliases.some((alias) => positions.has(alias));
  });
  if (eligible.length) return [...eligible].sort(playerComparator);

  const unused = players.filter((player) => !excludedIds.has(player.id));
  if (unused.length) return [...unused].sort(playerComparator);

  return [...players].sort(playerComparator);
}

function bestPlayerForSlot(players, slot, excludedIds = new Set()) {
  return candidatesForSlot(players, slot, excludedIds)[0] ?? null;
}

function resolveLineup(players) {
  const resolved = new Map();
  const usedIds = new Set();

  FORMATIONS[state.formation].forEach((slot, index) => {
    const explicit = state.lineup.get(index);
    const selection = explicit ?? bestPlayerForSlot(players, slot, usedIds);
    if (selection) {
      resolved.set(index, selection);
      usedIds.add(selection.id);
    }
  });

  return resolved;
}

function explicitIdsExcluding(slotIndex) {
  return new Set(
    [...state.lineup.entries()]
      .filter(([index]) => index !== slotIndex)
      .map(([, player]) => player.id)
  );
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
  els.rosterTitle.textContent = state.currentTeam ?? "No club rolled yet";
  els.rosterSummary.textContent = state.currentTeam
    ? `${players.length} players available for this club.`
    : "Roll a team to see the available players.";

  if (!players.length) {
    els.rosterGrid.innerHTML = `
      <div class="player-card">
        <div class="name">Ready to roll</div>
        <div class="detail">The first team you roll will populate the roster and formation board.</div>
      </div>
    `;
    return;
  }

  const ranked = [...players].sort(playerComparator);
  els.rosterGrid.innerHTML = ranked
    .map(
      (player) => `
        <article class="player-card">
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
        </article>
      `
    )
    .join("");
}

function renderPitch() {
  const formation = FORMATIONS[state.formation];
  const players = state.currentTeam ? teamPlayers(state.currentTeam) : [];
  const resolved = resolveLineup(players);
  els.formationTitle.textContent = state.formation;

  els.pitch.innerHTML = formation
    .map((slot, index) => {
      const selected = resolved.get(index) ?? null;
      const explicitValue = state.lineup.get(index) ? String(state.lineup.get(index).id) : "";
      const usedIds = explicitIdsExcluding(index);
      const options = candidatesForSlot(players, slot, usedIds);
      const optionsMarkup = options
        .map(
          (player) => `
            <option value="${player.id}" ${explicitValue === String(player.id) ? "selected" : ""}>
              ${escapeHtml(player.name)} · ${player.ovr}
            </option>
          `
        )
        .join("");

      return `
        <div class="slot ${selected ? "" : "empty"}">
          <div class="slot-label">
            <span>${slot}</span>
            <span>${index + 1}/${formation.length}</span>
          </div>
          <div>
            <div class="player">${selected ? escapeHtml(selected.name) : "Unfilled"}</div>
            <div class="detail">${selected ? `${escapeHtml(selected.position)} · ${selected.ovr} OVR` : "Select a player"}</div>
          </div>
          <select data-slot="${index}">
            <option value="">Auto-best</option>
            ${optionsMarkup}
          </select>
        </div>
      `;
    })
    .join("");

  els.pitch.querySelectorAll("select[data-slot]").forEach((select) => {
    const slotIndex = Number(select.dataset.slot);
    select.value = state.lineup.has(slotIndex) ? String(state.lineup.get(slotIndex).id) : "";
    select.addEventListener("change", () => {
      if (!select.value) {
        state.lineup.delete(slotIndex);
        renderPitch();
        return;
      }

      const playersForTeam = state.currentTeam ? teamPlayers(state.currentTeam) : [];
      const chosen = playersForTeam.find((player) => String(player.id) === select.value);
      if (!chosen) return;

      for (const [otherIndex, player] of [...state.lineup.entries()]) {
        if (otherIndex !== slotIndex && player.id === chosen.id) {
          state.lineup.delete(otherIndex);
        }
      }

      state.lineup.set(slotIndex, chosen);
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
  state.lineup.clear();
  renderAll();
}

function autoFillLineup() {
  if (!state.currentTeam) return;
  const players = teamPlayers(state.currentTeam);
  const filled = new Map();
  const usedIds = new Set();

  FORMATIONS[state.formation].forEach((slot, index) => {
    const best = bestPlayerForSlot(players, slot, usedIds);
    if (best) {
      filled.set(index, best);
      usedIds.add(best.id);
    }
  });

  state.lineup = filled;
  renderPitch();
}

async function init() {
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
    renderAll();
  });

  els.rollTeam.addEventListener("click", rollTeam);
  els.randomizeLineup.addEventListener("click", autoFillLineup);
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
