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
const PHASE_ONE_ROUNDS = 33;
const MAX_GOALS = 6;
const HOME_ADVANTAGE = 0.12;
const HOME_BASE = 0.18;
const AWAY_BASE = 0.14;
const DC_RHO = -0.08;
const TEAM_THEMES = {
  Aberdeen: { accent: "#b21f35", soft: "rgba(178, 31, 53, 0.18)" },
  Celtic: { accent: "#1a8f4c", soft: "rgba(26, 143, 76, 0.18)" },
  Dundee: { accent: "#0b5fa5", soft: "rgba(11, 95, 165, 0.18)" },
  "Dundee United": { accent: "#eb7a20", soft: "rgba(235, 122, 32, 0.18)" },
  Falkirk: { accent: "#1d7cc0", soft: "rgba(29, 124, 192, 0.18)" },
  Hearts: { accent: "#7d1d31", soft: "rgba(125, 29, 49, 0.18)" },
  Hibernian: { accent: "#0f7b43", soft: "rgba(15, 123, 67, 0.18)" },
  Kilmarnock: { accent: "#123f8f", soft: "rgba(18, 63, 143, 0.18)" },
  Livingston: { accent: "#af8b24", soft: "rgba(175, 139, 36, 0.18)" },
  Motherwell: { accent: "#8d2145", soft: "rgba(141, 33, 69, 0.18)" },
  Rangers: { accent: "#0a49b8", soft: "rgba(10, 73, 184, 0.18)" },
  "Ross County": { accent: "#125da6", soft: "rgba(18, 93, 166, 0.18)" },
  "St Mirren": { accent: "#38414a", soft: "rgba(56, 65, 74, 0.18)" },
  "St Johnstone": { accent: "#2f6b3e", soft: "rgba(47, 107, 62, 0.18)" },
};
const state = {
  data: null,
  teams: [],
  seasons: [],
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
    seasonActions: document.querySelector("[data-season-actions]"),
    seasonReveal: document.querySelector("[data-season-reveal]"),
    seasonRevealGrid: document.querySelector("[data-season-reveal-grid]"),
    playAgain: document.querySelector("[data-play-again]"),
    shareResult: document.querySelector("[data-share-result]"),
    shareModal: document.querySelector("[data-share-modal]"),
    sharePreview: document.querySelector("[data-share-preview]"),
    closeShareButtons: document.querySelectorAll("[data-close-share]"),
    downloadShare: document.querySelector("[data-download-share]"),
    postShare: document.querySelector("[data-post-share]"),
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
  const teamKey = typeof team === "string" ? team : team?.teamKey ?? team?.key ?? team?.label ?? team?.team ?? team?.name;
  return state.data.players.filter((player) => player.teamKey === teamKey);
}

function teamLabel(team) {
  return team?.teamLabel ?? team?.label ?? team?.name ?? String(team ?? "");
}

function randomChoice(values) {
  if (!values.length) return null;
  return values[Math.floor(Math.random() * values.length)];
}

function seasonSortValue(season) {
  const digits = String(season).match(/\d+/);
  return digits ? Number(digits[0]) : Number.POSITIVE_INFINITY;
}

function shareUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
}

function teamTheme(team) {
  return TEAM_THEMES[team] ?? { accent: "#5a6d62", soft: "rgba(90, 109, 98, 0.18)" };
}

function teamStyleAttr(team) {
  const theme = teamTheme(team);
  return `style="--team-accent:${theme.accent};--team-accent-soft:${theme.soft};"`;
}

function randomTeamForSeason(season) {
  return randomChoice(state.teams.filter((team) => team.season === season));
}

function currentTeamLabel() {
  return state.currentTeam ? teamLabel(state.currentTeam) : "Roll a team";
}

function ordinalSuffix(value) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function playerMetaLabel(player) {
  const rating = state.mode === "memory" ? "??" : player.ovr;
  return `${player.position} · ${rating}`;
}

function playerRatingLabel(player) {
  return state.mode === "memory" ? "??" : String(player.ovr ?? "??");
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
  const teamOptions = shuffle([...state.teams]).slice(0, 11);
  return teamOptions.map((team) => {
    const players = teamPlayers(team);
    const lineup = buildBestLineup(players);
    const strength = teamStrengthFromLineup(lineup);
    return {
      key: team.teamKey,
      name: team.teamLabel,
      season: team.season,
      team: team.team,
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
    key: TEAM_NAME,
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

function flipRound(round) {
  return round.map((match) => ({ home: match.away, away: match.home }));
}

function cloneRound(round) {
  return round.map((match) => ({ home: match.home, away: match.away }));
}

function generateScottishPremPhaseOne(teamNames) {
  const baseRounds = generateSingleRoundRobin(teamNames);
  const rounds = [];

  for (let cycle = 0; cycle < 3; cycle += 1) {
    const inverted = cycle % 2 === 1;
    baseRounds.forEach((round) => {
      rounds.push(inverted ? flipRound(round) : cloneRound(round));
    });
  }

  return rounds;
}

function generateSplitSchedule(topSix, bottomSix) {
  const topRounds = generateSingleRoundRobin(topSix);
  const bottomRounds = generateSingleRoundRobin(bottomSix);

  return topRounds.map((round, index) => [...cloneRound(round), ...cloneRound(bottomRounds[index])]);
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

function biasScorelineTowardsStrongerTeam(homeTeam, awayTeam, score) {
  if (score.homeGoals !== score.awayGoals) return score;

  const homeStrength = homeTeam.attack + homeTeam.defense;
  const awayStrength = awayTeam.attack + awayTeam.defense;
  const edge = homeStrength - awayStrength;
  const strongerHome = edge >= 0;
  const magnitude = Math.min(1, Math.abs(edge) / 20);
  const chanceToBreakDraw = 0.2 + magnitude * 0.5;

  if (Math.random() > chanceToBreakDraw) {
    return score;
  }

  const winnerGoals = Math.random() < 0.78 + magnitude * 0.12 ? 1 : 2;
  const loserGoals = winnerGoals === 1 ? 0 : 1;

  return strongerHome
    ? { homeGoals: winnerGoals, awayGoals: loserGoals }
    : { homeGoals: loserGoals, awayGoals: winnerGoals };
}

function initializeTable(teams) {
  const table = new Map();
  teams.forEach((team) => {
    table.set(team.key, {
      key: team.key,
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
  const firstPhaseSchedule = generateScottishPremPhaseOne(teams.map((team) => team.key));
  const teamByKey = new Map(teams.map((team) => [team.key, team]));
  const table = initializeTable(teams);
  const fixtures = [];
  const teamNameByKey = Object.fromEntries(teams.map((team) => [team.key, team.name]));

  firstPhaseSchedule.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match) => {
      const homeTeam = teamByKey.get(match.home);
      const awayTeam = teamByKey.get(match.away);
      const { homeLambda, awayLambda } = expectedGoals(homeTeam, awayTeam);
      const score = biasScorelineTowardsStrongerTeam(
        homeTeam,
        awayTeam,
        sampleScoreline(homeLambda, awayLambda),
      );
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

  const phaseOneTable = sortTableRows(table.values());
  const topSix = phaseOneTable.slice(0, 6).map((row) => row.key);
  const bottomSix = phaseOneTable.slice(6, 12).map((row) => row.key);
  const splitSchedule = generateSplitSchedule(topSix, bottomSix);

  splitSchedule.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match) => {
      const homeTeam = teamByKey.get(match.home);
      const awayTeam = teamByKey.get(match.away);
      const { homeLambda, awayLambda } = expectedGoals(homeTeam, awayTeam);
      const score = biasScorelineTowardsStrongerTeam(
        homeTeam,
        awayTeam,
        sampleScoreline(homeLambda, awayLambda),
      );
      const fixture = {
        round: PHASE_ONE_ROUNDS + roundIndex + 1,
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
  const finalRows = [...table.values()];
  const finalTop = sortTableRows(finalRows.filter((row) => topSix.includes(row.key)));
  const finalBottom = sortTableRows(finalRows.filter((row) => bottomSix.includes(row.key)));
  const finalTable = [...finalTop, ...finalBottom];

  return {
    teams,
    fixtures,
    userFixtures,
    finalTable,
    revealed: 0,
    complete: false,
    teamName: TEAM_NAME,
    splitRound: PHASE_ONE_ROUNDS,
    teamNameByKey,
  };
}

function buildPresetSeasonTeam() {
  const latestSeason = state.seasons[state.seasons.length - 1] ?? null;
  const preferredTeam =
    state.teams.find((team) => team.season === latestSeason && team.team === "Celtic") ??
    state.teams.find((team) => team.season === latestSeason) ??
    state.teams[0];
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
  const lineupComplete = lineUpIsComplete();
  const awaitingSelection = Boolean(state.currentTeam && !lineupComplete);
  els.startSeason.hidden = !lineupComplete || state.view !== "game";
  els.rollTeam.hidden = lineupComplete || state.view !== "game" || awaitingSelection;
  els.testSeason.hidden = lineupComplete || state.view !== "game" || awaitingSelection;
  els.rollTeam.disabled = lineupComplete || awaitingSelection;
  els.testSeason.disabled = state.view !== "home" && state.view !== "game";
  els.currentTeam.textContent = currentTeamLabel();
}

function openDialog(dialog) {
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
  }
}

function closeDialog(dialog) {
  if (dialog && dialog.open) {
    dialog.close();
  }
}

function renderRoster() {
  const players = state.currentTeam ? teamPlayers(state.currentTeam) : [];
  const selected = selectedPlayer();

  els.rosterTitle.textContent = state.currentTeam ? teamLabel(state.currentTeam) : "No club rolled yet";
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
      const selectedStyle = isSelected ? teamStyleAttr(player.team) : "";
      return `
        <button
          class="player-card ${isSelected ? "selected" : ""} ${unavailable ? "unavailable" : ""}"
          data-player-id="${player.id}"
          type="button"
          ${selectedStyle}
          ${unavailable ? "disabled" : ""}
          title="${unavailable ? "No open slot for this player in the current formation" : ""}"
        >
          <span class="player-name">${escapeHtml(player.name)}</span>
          <span class="player-meta">${escapeHtml(playerMetaLabel(player))}</span>
        </button>
      `;
    })
    .join("");

  els.rosterGrid.querySelectorAll("[data-player-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = button.dataset.playerId;
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
          const bubbleStyle = lockedPlayer ? teamStyleAttr(lockedPlayer.team) : "";
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
                  ? `<span class="slot-bubble" aria-hidden="true" title="${escapeHtml(lockedPlayer.name)}" ${bubbleStyle}>${escapeHtml(lockedPlayer.name)}</span>`
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
    renderSeasonActions();
    renderSeasonReveal();
  } else {
    els.seasonActions.hidden = true;
    if (els.seasonReveal) els.seasonReveal.hidden = true;
  }
}

function renderSeasonFeed() {
  if (!state.season) return;
  const visibleFixtures = state.season.userFixtures.slice(0, state.season.revealed);
  const items = [];
  let previousRound = null;

  visibleFixtures.forEach((fixture) => {
    if (previousRound !== null && previousRound <= state.season.splitRound && fixture.round > state.season.splitRound) {
      items.push(renderSeasonSplitDivider());
    }

    items.push(renderSeasonMatch(fixture));
    previousRound = fixture.round;
  });

  els.seasonFeed.innerHTML = items.join("");
  scrollSeasonFeedToBottom();
}

function renderSeasonSplitDivider() {
  return `
    <div class="season-divider">
      <span>Split stage begins: top six and bottom six</span>
    </div>
  `;
}

function renderSeasonMatch(match) {
  const userHome = match.home === TEAM_NAME;
  const resultClass =
    match.homeGoals === match.awayGoals
      ? "draw"
      : (userHome && match.homeGoals > match.awayGoals) || (!userHome && match.awayGoals > match.homeGoals)
        ? "win"
        : "loss";
  const opponentKey = userHome ? match.away : match.home;
  const opponentName = state.season.teamNameByKey[opponentKey] ?? opponentKey;
  const score = `${match.homeGoals}-${match.awayGoals}`;
  return `
    <article class="season-match ${resultClass}">
      <div class="season-match-meta">Round ${match.round} · ${userHome ? "Home" : "Away"}</div>
      <div class="season-match-row">
        <span class="season-match-team">${userHome ? "You" : escapeHtml(opponentName)}</span>
        <strong class="season-match-score">${escapeHtml(score)}</strong>
        <span class="season-match-team">${userHome ? escapeHtml(opponentName) : "You"}</span>
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

function renderSeasonActions() {
  if (!state.season) return;
  els.seasonActions.hidden = !state.season.complete;
}

function renderSeasonReveal() {
  if (!state.season || !els.seasonReveal || !els.seasonRevealGrid) return;
  const showReveal = state.mode === "memory" && state.season.complete;
  els.seasonReveal.hidden = !showReveal;
  if (!showReveal) {
    els.seasonRevealGrid.innerHTML = "";
    return;
  }

  const lineup = orderedLineupFromMap(state.lineup);
  els.seasonRevealGrid.innerHTML = lineup
    .map(
      (player, index) => `
        <article class="season-reveal-card">
          <div class="season-reveal-slot">${escapeHtml(FORMATIONS[state.formation][index])}</div>
          <div class="season-reveal-name">${escapeHtml(player.name)}</div>
          <div class="season-reveal-rating">${escapeHtml(String(player.ovr ?? "??"))}</div>
        </article>
      `,
    )
    .join("");
}

function currentUserRow() {
  if (!state.season?.finalTable?.length) return null;
  return state.season.finalTable.find((row) => row.team === TEAM_NAME) ?? null;
}

function topTableRows(limit = 8) {
  if (!state.season?.finalTable?.length) return [];
  const rows = [...state.season.finalTable];
  const userRow = rows.find((row) => row.team === TEAM_NAME);
  const top = rows.slice(0, limit);
  if (userRow && !top.includes(userRow)) {
    top[top.length - 1] = userRow;
  }
  return top;
}

function seasonSummaryText() {
  const row = currentUserRow();
  if (!row) return "Scotland-38-0";
  return `${TEAM_NAME} finished with ${row.points} points`;
}

function formatShareText() {
  const row = currentUserRow();
  const position = row ? state.season.finalTable.findIndex((entry) => entry.team === TEAM_NAME) + 1 : null;
  return `I just completed a season on Scotland-38-0${row ? `, finishing ${position}${ordinalSuffix(position)} with ${row.points} points` : ""}. ${shareUrl()}`;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function generateShareImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, "#efe8df");
  bgGradient.addColorStop(1, "#e1ddd4");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  drawRoundedRect(ctx, 48, 48, 1104, 1404, 34);
  ctx.fill();
  ctx.strokeStyle = "rgba(32,38,43,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#20262b";
  ctx.font = "700 54px 'Space Grotesk', sans-serif";
  ctx.fillText("Scotland-38-0", 92, 132);

  ctx.fillStyle = "#6d767f";
  ctx.font = "500 24px 'Inter', sans-serif";
  ctx.fillText(state.season?.teamName ?? TEAM_NAME, 92, 180);

  const row = currentUserRow();
  ctx.fillStyle = "#20262b";
  ctx.font = "700 34px 'Space Grotesk', sans-serif";
  ctx.fillText(row ? `Final position: ${state.season.finalTable.findIndex((entry) => entry.team === TEAM_NAME) + 1}` : "Season result", 92, 248);

  ctx.fillStyle = "#6d767f";
  ctx.font = "500 22px 'Inter', sans-serif";
  ctx.fillText(row ? `${row.points} pts  ·  ${row.gf} GF  ·  ${row.ga} GA  ·  ${row.gd} GD` : "", 92, 286);

  ctx.fillStyle = "#20262b";
  ctx.font = "700 30px 'Space Grotesk', sans-serif";
  ctx.fillText("Lineup", 92, 356);

  ctx.font = "600 22px 'Inter', sans-serif";
  const lineup = orderedLineupFromMap(state.lineup);
  lineup.forEach((player, index) => {
    const y = 406 + index * 42;
    ctx.fillStyle = "#6d767f";
    ctx.fillText(FORMATIONS[state.formation][index], 92, y);
    ctx.fillStyle = "#20262b";
    ctx.fillText(player.name, 184, y);
    ctx.fillStyle = "#6d767f";
    ctx.fillText(playerRatingLabel(player), 872, y);
  });

  ctx.fillStyle = "#20262b";
  ctx.font = "700 30px 'Space Grotesk', sans-serif";
  ctx.fillText("League table", 92, 920);

  const rows = topTableRows(8);
  const startY = 970;
  ctx.font = "600 20px 'Inter', sans-serif";
  rows.forEach((tableRow, index) => {
    const y = startY + index * 44;
    const highlight = tableRow.team === TEAM_NAME;
    if (highlight) {
      ctx.fillStyle = "rgba(90,109,98,0.12)";
      drawRoundedRect(ctx, 76, y - 28, 1048, 34, 16);
      ctx.fill();
    }
    ctx.fillStyle = "#6d767f";
    ctx.fillText(String(index + 1), 92, y);
    ctx.fillStyle = "#20262b";
    ctx.fillText(tableRow.team, 136, y);
    ctx.fillStyle = "#6d767f";
    ctx.fillText(String(tableRow.played), 626, y);
    ctx.fillText(String(tableRow.points), 1032, y);
  });

  ctx.fillStyle = "#6d767f";
  ctx.font = "500 20px 'Inter', sans-serif";
  ctx.fillText("Scotland-38-0", 92, 1422);
  ctx.textAlign = "right";
  ctx.fillText(shareUrl(), 1108, 1422);
  ctx.textAlign = "left";

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      resolve({ blob, dataUrl: canvas.toDataURL("image/png") });
    }, "image/png");
  });
}

async function openShareModal() {
  if (!state.season?.complete) return;
  const asset = await generateShareImage();
  if (!asset) return;
  els.sharePreview.src = asset.dataUrl;
  els.sharePreview.dataset.shareText = formatShareText();
  openDialog(els.shareModal);
}

async function downloadShareImage() {
  const asset = await generateShareImage();
  if (!asset) return;
  const url = URL.createObjectURL(asset.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "scotland-38-0-result.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function postShareResult() {
  const text = formatShareText();
  const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
  window.open(intentUrl, "_blank", "noopener,noreferrer");
}

function renderSeason() {
  renderSeasonHeader();
  renderSeasonFeed();
  renderSeasonReveal();
  if (state.season && !state.season.complete) {
    els.seasonTableWrap.innerHTML = `<div class="season-placeholder">The table will appear when the season finishes.</div>`;
    els.seasonActions.hidden = true;
    if (els.seasonReveal) els.seasonReveal.hidden = true;
  }
}

function scrollSeasonFeedToBottom() {
  if (!els.seasonFeed) return;
  requestAnimationFrame(() => {
    els.seasonFeed.scrollTop = Math.max(0, els.seasonFeed.scrollHeight - els.seasonFeed.clientHeight);
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
  renderSeasonActions();
  renderSeasonReveal();
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
  if (!state.teams.length || lineUpIsComplete() || state.currentTeam) return;
  const season = randomChoice(state.seasons);
  state.currentTeam = randomTeamForSeason(season) ?? randomChoice(state.teams);
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

    state.season.revealed += 1;
    renderSeasonFeed();
    renderSeasonHeader();

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
  on(els.playAgain, "click", goHome);
  on(els.shareResult, "click", openShareModal);
  on(els.seasonBack, "click", () => {
    clearSeasonTimer();
    state.view = "game";
    window.location.hash = "game";
    renderAll();
  });
  on(els.rollTeam, "click", rollTeam);
  on(els.startSeason, "click", startSeason);
  on(els.testSeason, "click", testSeason);
  on(els.downloadShare, "click", downloadShareImage);
  on(els.postShare, "click", postShareResult);
  els.closeShareButtons.forEach((button) => on(button, "click", () => closeDialog(els.shareModal)));

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
    renderRoster();
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

  const response = await fetch("./data/scottish-premiership-players.json");
  if (!response.ok) {
    throw new Error(`Failed to load player data: ${response.status}`);
  }

  state.data = await response.json();
  state.teams = [];
  state.seasons = [...new Set(state.data.players.map((player) => player.season))].sort(
    (a, b) => seasonSortValue(a) - seasonSortValue(b) || String(a).localeCompare(String(b)),
  );
  const teamMap = new Map();
  state.data.players.forEach((player) => {
    if (!teamMap.has(player.teamKey)) {
      teamMap.set(player.teamKey, {
        key: player.teamKey,
        team: player.team,
        name: player.teamLabel,
        label: player.teamLabel,
        teamKey: player.teamKey,
        teamLabel: player.teamLabel,
        season: player.season,
      });
    }
  });
  state.teams = [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name));

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
      <p>Make sure <code>site/data/scottish-premiership-players.json</code> has been generated.</p>
    </main>
  `;
});
