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

const TEAM_NAME = "38-0 XI";
const MAX_GOALS = 6;
const HOME_ADVANTAGE = 0.12;
const HOME_BASE = 0.18;
const AWAY_BASE = 0.14;
const DC_RHO = -0.08;

const state = {
  data: null,
  teams: [],
  view: "home",
  formation: "4-3-3",
  mode: "classic",
  currentTeam: null,
  lineup: new Map(),
  selectedPlayerId: null,
  season: null,
  seasonTimer: null,
};

let els = null;

function bindElements() {
  els = {
    totalPlayers: document.querySelector("[data-total-players]"),
    totalTeams: document.querySelector("[data-total-teams]"),
    homeView: document.querySelector("[data-home-view]"),
    gameView: document.querySelector("[data-game-view]"),
    seasonView: document.querySelector("[data-season-view]"),
    homeFormation: document.querySelector("[data-home-formation]"),
    homeMode: document.querySelector("[data-home-mode]"),
    playGame: document.querySelector("[data-play-game]"),
    backHome: document.querySelector("[data-back-home]"),
    rollTeam: document.querySelector("[data-roll-team]"),
    startSeason: document.querySelector("[data-start-season]"),
    testSeason: document.querySelector("[data-test-season]"),
    gameFormation: document.querySelector("[data-game-formation]"),
    gameMode: document.querySelector("[data-game-mode]"),
    currentTeam: document.querySelector("[data-current-team]"),
    currentFormation: document.querySelector("[data-current-formation]"),
    rosterTitle: document.querySelector("[data-roster-title]"),
    rosterSummary: document.querySelector("[data-roster-summary]"),
    rosterGrid: document.querySelector("[data-roster-grid]"),
    formationTitle: document.querySelector("[data-formation-title]"),
    pitch: document.querySelector("[data-pitch]"),
    seasonBack: document.querySelector("[data-season-back]"),
    seasonTeamName: document.querySelector("[data-season-team-name]"),
    seasonProgress: document.querySelector("[data-season-progress]"),
    seasonFixtures: document.querySelector("[data-season-fixtures]"),
    seasonStatus: document.querySelector("[data-season-status]"),
    seasonFeed: document.querySelector("[data-season-feed]"),
    seasonTableWrap: document.querySelector("[data-season-table-wrap]"),
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

function lineUpIsComplete() {
  return state.lineup.size === FORMATIONS[state.formation].length;
}

function orderedLineupFromMap(lineupMap) {
  return FORMATIONS[state.formation].map((_, index) => lineupMap.get(index)).filter(Boolean);
}

function playerAttackScore(player) {
  const position = player.position;
  const attackCore =
    (player.sho ?? player.ovr) * 0.35 +
    (player.dri ?? player.ovr) * 0.25 +
    (player.pas ?? player.ovr) * 0.2 +
    (player.pac ?? player.ovr) * 0.1 +
    (player.ovr ?? 0) * 0.1;
  if (position === "GK") return 22 + (player.ovr ?? 0) * 0.2;
  const boost = ["ST", "LW", "RW", "CAM", "LM", "RM"].includes(position) ? 6 : 0;
  return attackCore + boost;
}

function playerDefenseScore(player) {
  const position = player.position;
  const defenseCore =
    (player.def ?? player.ovr) * 0.45 +
    (player.phy ?? player.ovr) * 0.2 +
    (player.pas ?? player.ovr) * 0.15 +
    (player.ovr ?? 0) * 0.2;
  if (position === "GK") return 68 + (player.ovr ?? 0) * 0.25;
  const boost = ["CB", "LB", "RB", "CDM"].includes(position) ? 6 : 0;
  return defenseCore + boost;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function teamStrengthFromLineup(lineup) {
  return {
    attack: average(lineup.map(playerAttackScore)),
    defense: average(lineup.map(playerDefenseScore)),
  };
}

function buildBestLineup(players, formation = state.formation) {
  const lineup = new Map();
  const usedIds = new Set();
  const slots = FORMATIONS[formation];

  slots.forEach((slot, index) => {
    const eligible = players.filter((player) => !usedIds.has(player.id) && playerCanPlaySlot(player, slot));
    const pool = eligible.length ? eligible : players.filter((player) => !usedIds.has(player.id));
    const fallback = pool.length ? pool : players;
    const chosen =
      [...fallback].sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0) || a.name.localeCompare(b.name))[0] ?? null;
    if (chosen) {
      lineup.set(index, chosen);
      usedIds.add(chosen.id);
    }
  });

  return orderedLineupFromMap(lineup);
}

function buildOpponentTeams() {
  const teamNames = shuffle([...new Set(state.teams)]).slice(0, 19);
  return teamNames.map((name) => {
    const players = teamPlayers(name);
    const lineup = buildBestLineup(players);
    const strength = teamStrengthFromLineup(lineup);
    return {
      name,
      lineup,
      attack: strength.attack,
      defense: strength.defense,
      isUser: false,
    };
  });
}

function buildUserTeam() {
  if (!lineUpIsComplete()) return null;
  const lineup = orderedLineupFromMap(state.lineup);
  const strength = teamStrengthFromLineup(lineup);
  return {
    name: TEAM_NAME,
    lineup,
    attack: strength.attack,
    defense: strength.defense,
    isUser: true,
  };
}

function shuffle(values) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSingleRoundRobin(teamNames) {
  const teams = [...teamNames];
  if (teams.length % 2 === 1) teams.push(null);
  const rounds = [];
  let rotation = [...teams];

  for (let round = 0; round < teams.length - 1; round += 1) {
    const matches = [];
    for (let i = 0; i < teams.length / 2; i += 1) {
      const home = rotation[i];
      const away = rotation[teams.length - 1 - i];
      if (home && away) matches.push({ home, away });
    }
    rounds.push(matches);
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, rotation.length - 1)];
  }

  return rounds;
}

function generateSeasonSchedule(teamNames) {
  const firstLeg = generateSingleRoundRobin(teamNames);
  const secondLeg = firstLeg.map((round) => round.map((match) => ({ home: match.away, away: match.home })));
  return [...firstLeg, ...secondLeg];
}

function poissonProbability(k, lambda) {
  let numerator = Math.exp(-lambda);
  for (let i = 0; i < k; i += 1) {
    numerator *= lambda / (i + 1);
  }
  return numerator;
}

function dixonColesAdjustment(homeGoals, awayGoals, homeLambda, awayLambda) {
  if (homeGoals === 0 && awayGoals === 0) return Math.max(0.01, 1 - homeLambda * awayLambda * DC_RHO);
  if (homeGoals === 0 && awayGoals === 1) return Math.max(0.01, 1 + homeLambda * DC_RHO);
  if (homeGoals === 1 && awayGoals === 0) return Math.max(0.01, 1 + awayLambda * DC_RHO);
  if (homeGoals === 1 && awayGoals === 1) return Math.max(0.01, 1 - DC_RHO);
  return 1;
}

function scoreMatrix(homeLambda, awayLambda) {
  const matrix = [];
  let total = 0;

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    matrix[homeGoals] = [];
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      const base = poissonProbability(homeGoals, homeLambda) * poissonProbability(awayGoals, awayLambda);
      const adjusted = base * dixonColesAdjustment(homeGoals, awayGoals, homeLambda, awayLambda);
      const safe = Number.isFinite(adjusted) && adjusted > 0 ? adjusted : 0.000001;
      matrix[homeGoals][awayGoals] = safe;
      total += safe;
    }
  }

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      matrix[homeGoals][awayGoals] /= total;
    }
  }

  return matrix;
}

function sampleScoreline(homeLambda, awayLambda) {
  const matrix = scoreMatrix(homeLambda, awayLambda);
  const random = Math.random();
  let cursor = 0;

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      cursor += matrix[homeGoals][awayGoals];
      if (random <= cursor) {
        return { homeGoals, awayGoals };
      }
    }
  }

  return { homeGoals: 0, awayGoals: 0 };
}

function expectedGoals(homeTeam, awayTeam) {
  const homeLambda = Math.exp(HOME_BASE + HOME_ADVANTAGE + (homeTeam.attack - awayTeam.defense) / 28);
  const awayLambda = Math.exp(AWAY_BASE + (awayTeam.attack - homeTeam.defense) / 28);
  return { homeLambda, awayLambda };
}

function initializeTable(teams) {
  const table = new Map();
  teams.forEach((team) => {
    table.set(team.name, {
      team: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    });
  });
  return table;
}

function applyResult(table, match) {
  const homeRow = table.get(match.home);
  const awayRow = table.get(match.away);
  homeRow.played += 1;
  awayRow.played += 1;
  homeRow.gf += match.homeGoals;
  homeRow.ga += match.awayGoals;
  awayRow.gf += match.awayGoals;
  awayRow.ga += match.homeGoals;

  if (match.homeGoals > match.awayGoals) {
    homeRow.wins += 1;
    awayRow.losses += 1;
    homeRow.points += 3;
  } else if (match.homeGoals < match.awayGoals) {
    awayRow.wins += 1;
    homeRow.losses += 1;
    awayRow.points += 3;
  } else {
    homeRow.draws += 1;
    awayRow.draws += 1;
    homeRow.points += 1;
    awayRow.points += 1;
  }

  homeRow.gd = homeRow.gf - homeRow.ga;
  awayRow.gd = awayRow.gf - awayRow.ga;
}

function sortTableRows(rows) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
}

function buildSeason() {
  const userTeam = buildUserTeam();
  if (!userTeam) return null;

  const opponentTeams = buildOpponentTeams();
  const teams = shuffle([userTeam, ...opponentTeams]);
  const schedule = generateSeasonSchedule(teams.map((team) => team.name));
  const teamByName = new Map(teams.map((team) => [team.name, team]));
  const table = initializeTable(teams);
  const fixtures = [];

  schedule.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match) => {
      const homeTeam = teamByName.get(match.home);
      const awayTeam = teamByName.get(match.away);
      const { homeLambda, awayLambda } = expectedGoals(homeTeam, awayTeam);
      const score = sampleScoreline(homeLambda, awayLambda);
      const fixture = {
        round: roundIndex + 1,
        home: match.home,
        away: match.away,
        homeGoals: score.homeGoals,
        awayGoals: score.awayGoals,
      };
      fixtures.push(fixture);
      applyResult(table, fixture);
    });
  });

  const userFixtures = fixtures.filter((fixture) => fixture.home === TEAM_NAME || fixture.away === TEAM_NAME);
  const finalTable = sortTableRows(table.values());

  return {
    teams,
    fixtures,
    userFixtures,
    finalTable,
    revealed: 0,
    complete: false,
    teamName: TEAM_NAME,
  };
}

function buildPresetSeasonTeam() {
  const preferredTeam = state.teams.find((team) => team.toLowerCase() === "liverpool") ?? state.teams[0];
  if (!preferredTeam) return false;

  state.currentTeam = preferredTeam;
  state.selectedPlayerId = null;
  state.lineup.clear();

  const players = teamPlayers(preferredTeam);
  const filled = buildBestLineup(players);
  filled.forEach((player, index) => {
    state.lineup.set(index, player);
  });

  state.currentTeam = null;
  return lineUpIsComplete();
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
  const game = state.view === "game";
  const season = state.view === "season";
  els.homeView.hidden = !home;
  els.gameView.hidden = !game;
  els.seasonView.hidden = !season;
  document.body.dataset.view = state.view;
}

function renderGameMeta() {
  els.gameFormation.textContent = state.formation;
  els.gameMode.textContent = state.mode === "classic" ? "Classic" : "Memory";
  els.currentFormation.textContent = state.formation;
  els.startSeason.hidden = !lineUpIsComplete() || state.view !== "game";
  els.rollTeam.disabled = lineUpIsComplete();
  els.testSeason.disabled = state.view !== "home" && state.view !== "game";
}

function renderRoster() {
  const players = state.currentTeam ? teamPlayers(state.currentTeam) : [];
  const selected = selectedPlayer();

  els.rosterTitle.textContent = state.currentTeam ?? "No club rolled yet";
  els.rosterSummary.textContent = state.currentTeam
    ? state.selectedPlayerId
      ? `Selected: ${selected?.name ?? "Unknown"}. Lock them, then reroll for the next player.`
      : `${players.length} players available. Click one player, then a valid slot.`
    : lineUpIsComplete()
      ? "Squad complete. Start the season."
      : state.lineup.size
        ? "Player locked. Reroll to pick the next team."
        : "Roll a team to see the available players.";

  if (!players.length) {
    els.rosterGrid.innerHTML = `
      <div class="roster-empty">
        ${
          lineUpIsComplete()
            ? "Squad complete. Start the season."
            : state.lineup.size
              ? "Player locked. Roll another team to continue."
              : "Roll a team to begin."
        }
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
              ${
                lockedPlayer
                  ? `<span class="slot-bubble" aria-hidden="true" title="${escapeHtml(lockedPlayer.name)}">${escapeHtml(getPlayerBubbleLabel(lockedPlayer))}</span>`
                  : ""
              }
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
      renderGameMeta();
    });
  });
}

function renderGame() {
  renderGameMeta();
  renderRoster();
  renderPitch();
}

function renderSeasonHeader() {
  if (!state.season) return;
  const complete = state.season.complete || state.season.revealed >= state.season.userFixtures.length;
  if (complete) {
    state.season.complete = true;
  }
  els.seasonTeamName.textContent = state.season.teamName;
  els.seasonProgress.textContent = `${state.season.revealed} / ${state.season.userFixtures.length}`;
  els.seasonFixtures.textContent = `${state.season.userFixtures.length} / ${state.season.userFixtures.length} fixtures`;
  els.seasonStatus.textContent = complete ? "Season complete" : "Season in progress";
  if (complete) {
    renderSeasonTable();
  }
}

function renderSeasonFeed() {
  if (!state.season) return;
  els.seasonFeed.innerHTML = state.season.userFixtures
    .slice(0, state.season.revealed)
    .map(renderSeasonMatch)
    .join("");
  scrollSeasonFeedToBottom();
}

function renderSeasonMatch(match) {
  const userHome = match.home === TEAM_NAME;
  const resultClass =
    match.homeGoals === match.awayGoals
      ? "draw"
      : (userHome && match.homeGoals > match.awayGoals) || (!userHome && match.awayGoals > match.homeGoals)
        ? "win"
        : "loss";
  const opponent = userHome ? match.away : match.home;
  const score = `${match.homeGoals}-${match.awayGoals}`;
  return `
    <article class="season-match ${resultClass}">
      <div class="season-match-meta">Round ${match.round} · ${userHome ? "Home" : "Away"}</div>
      <div class="season-match-row">
        <span class="season-match-team">${userHome ? "You" : escapeHtml(opponent)}</span>
        <strong class="season-match-score">${escapeHtml(score)}</strong>
        <span class="season-match-team">${userHome ? escapeHtml(opponent) : "You"}</span>
      </div>
    </article>
  `;
}

function renderSeasonTable() {
  if (!state.season) return;
  const rows = state.season.finalTable;
  els.seasonTableWrap.innerHTML = `
    <table class="season-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GF</th>
          <th>GA</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row, index) => `
              <tr class="${row.team === TEAM_NAME ? "highlight" : ""}">
                <td>${index + 1}</td>
                <td>${escapeHtml(row.team)}</td>
                <td>${row.played}</td>
                <td>${row.wins}</td>
                <td>${row.draws}</td>
                <td>${row.losses}</td>
                <td>${row.gf}</td>
                <td>${row.ga}</td>
                <td>${row.gd}</td>
                <td>${row.points}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSeason() {
  renderSeasonHeader();
  renderSeasonFeed();
  if (state.season && !state.season.complete) {
    els.seasonTableWrap.innerHTML = `<div class="season-placeholder">The table will appear when the season finishes.</div>`;
  }
}

function scrollSeasonFeedToBottom() {
  if (!els.seasonFeed) return;
  requestAnimationFrame(() => {
    els.seasonFeed.scrollTop = els.seasonFeed.scrollHeight;
  });
}

function finishSeason() {
  if (!state.season) return;
  state.season.complete = true;
  state.seasonTimer = null;
  els.seasonStatus.textContent = "Season complete";
  renderSeasonHeader();
  renderSeasonFeed();
  renderSeasonTable();
}

function renderAll() {
  renderStats();
  renderHomeSetup();
  renderView();
  renderGame();
  renderSeason();
}

function clearSeasonTimer() {
  if (state.seasonTimer) {
    clearTimeout(state.seasonTimer);
    state.seasonTimer = null;
  }
}

function rollTeam() {
  if (!state.teams.length || lineUpIsComplete()) return;
  state.currentTeam = state.teams[Math.floor(Math.random() * state.teams.length)];
  state.selectedPlayerId = null;
  renderGame();
}

function startGame() {
  state.view = "game";
  state.season = null;
  state.currentTeam = null;
  state.lineup.clear();
  state.selectedPlayerId = null;
  window.location.hash = "game";
  renderAll();
}

function goHome() {
  clearSeasonTimer();
  state.view = "home";
  window.location.hash = "";
  renderAll();
}

function startSeason() {
  const season = buildSeason();
  if (!season) return;
  clearSeasonTimer();
  state.season = season;
  state.view = "season";
  window.location.hash = "season";
  renderAll();
  animateSeason();
}

function testSeason() {
  const ready = buildPresetSeasonTeam();
  if (!ready) return;
  startSeason();
}

function animateSeason() {
  if (!state.season) return;
  clearSeasonTimer();
  state.season.revealed = 0;
  state.season.complete = false;
  els.seasonFeed.innerHTML = "";
  renderSeasonHeader();
  els.seasonTableWrap.innerHTML = `<div class="season-placeholder">The table will appear when the season finishes.</div>`;

  const tick = () => {
    if (!state.season || state.view !== "season") return;
    const next = state.season.userFixtures[state.season.revealed];
    if (!next) {
      finishSeason();
      return;
    }

    els.seasonFeed.insertAdjacentHTML("beforeend", renderSeasonMatch(next));
    state.season.revealed += 1;
    renderSeasonHeader();
    scrollSeasonFeedToBottom();

    if (state.season.revealed >= state.season.userFixtures.length) {
      finishSeason();
      return;
    }

    state.seasonTimer = setTimeout(tick, 650);
  };

  tick();
}

function wireControls() {
  const on = (element, eventName, handler) => {
    if (element && typeof element.addEventListener === "function") {
      element.addEventListener(eventName, handler);
    }
  };

  on(els.playGame, "click", startGame);
  on(els.backHome, "click", goHome);
  on(els.seasonBack, "click", () => {
    clearSeasonTimer();
    state.view = "game";
    window.location.hash = "game";
    renderAll();
  });
  on(els.rollTeam, "click", rollTeam);
  on(els.startSeason, "click", startSeason);
  on(els.testSeason, "click", testSeason);

  on(els.homeFormation, "change", () => {
    state.formation = els.homeFormation.value;
    state.lineup.clear();
    state.selectedPlayerId = null;
    state.currentTeam = null;
    renderAll();
  });

  on(els.homeMode, "change", () => {
    state.mode = els.homeMode.value;
    renderHomeSetup();
    renderGameMeta();
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#season") {
      state.view = "season";
    } else if (window.location.hash === "#game") {
      state.view = "game";
    } else {
      state.view = "home";
    }
    renderAll();
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

  wireControls();

  if (window.location.hash === "#game") {
    state.view = "game";
  } else if (window.location.hash === "#season") {
    state.view = state.season ? "season" : "game";
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
