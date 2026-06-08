#!/usr/bin/env python3
from __future__ import annotations

import ast
import csv
import json
import math
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SPECS = [
    {"kind": "eafc", "season": "FC26", "path": ROOT / "data" / "EAFC26-Men.csv"},
    {"kind": "eafc", "season": "FC25", "path": ROOT / "data" / "fc25.csv"},
    {"kind": "fc24", "season": "FC24", "path": ROOT / "data" / "fc24.csv"},
    {"kind": "prev", "season": None, "path": ROOT / "data" / "fc_prev.csv"},
]
OUTPUT = ROOT / "site" / "data" / "scottish-premiership-players.json"

SCOTTISH_TEAM_ALIASES = {
    "aberdeen": "Aberdeen",
    "celtic": "Celtic",
    "dundee": "Dundee",
    "dundee fc": "Dundee",
    "dundee united": "Dundee United",
    "falkirk": "Falkirk",
    "hearts": "Hearts",
    "heart of midlothian": "Hearts",
    "hibernian": "Hibernian",
    "kilmarnock": "Kilmarnock",
    "livingston": "Livingston",
    "motherwell": "Motherwell",
    "rangers": "Rangers",
    "rangers fc": "Rangers",
    "ross county": "Ross County",
    "st mirren": "St Mirren",
    "st. mirren": "St Mirren",
    "st johnstone": "St Johnstone",
    "st. johnstone": "St Johnstone",
}

RATING_FIELDS = [
    "ovr",
    "pac",
    "sho",
    "pas",
    "dri",
    "def",
    "phy",
    "acceleration",
    "sprintSpeed",
    "positioning",
    "finishing",
    "shotPower",
    "longShots",
    "volleys",
    "penalties",
    "vision",
    "crossing",
    "freeKickAccuracy",
    "shortPassing",
    "longPassing",
    "curve",
    "dribbling",
    "agility",
    "balance",
    "reactions",
    "ballControl",
    "composure",
    "interceptions",
    "headingAccuracy",
    "defAwareness",
    "standingTackle",
    "slidingTackle",
    "jumping",
    "stamina",
    "strength",
    "aggression",
    "gkDiving",
    "gkHandling",
    "gkKicking",
    "gkPositioning",
    "gkReflexes",
]


def parse_alt_positions(value: str) -> list[str]:
    if not value:
        return []
    text = str(value).strip()
    if not text:
        return []
    try:
        parsed = ast.literal_eval(text)
    except (ValueError, SyntaxError):
        parsed = None
    if isinstance(parsed, list):
        return [str(item) for item in parsed if item]
    return [part.strip() for part in text.split(",") if part.strip()]


def parse_int(value: str):
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def round_half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def scale_rating(value: int | float | None, minimum: int | float | None, maximum: int | float | None) -> int | None:
    if value is None or minimum is None or maximum is None:
        return None
    if maximum == minimum:
        return 99
    scaled = 50 + ((value - minimum) / (maximum - minimum)) * 49
    return round_half_up(scaled)


def canonical_team_name(team: str | None) -> str | None:
    if not team:
        return None
    return SCOTTISH_TEAM_ALIASES.get(str(team).strip().lower())


def season_label(season_code: str) -> str:
    value = str(season_code).strip()
    if value.startswith("FC") and value[2:].isdigit():
        return str(2000 + int(value[2:]))
    if value.startswith("FIFA") and value[4:].isdigit():
        return str(2000 + int(value[4:]))
    if value.isdigit():
        return value
    return value


def season_sort_value(season_code: str) -> int:
    digits = "".join(ch for ch in str(season_code) if ch.isdigit())
    return int(digits) if digits else 0


def team_key(season_code: str, team: str) -> str:
    return f"{season_code}::{team}"


def team_label(season_code: str, team: str) -> str:
    return f"{team} ({season_label(season_code)})"


def derive_eafc26_ratings(row: dict[str, str]) -> dict[str, int | None]:
    return {
        "ovr": parse_int(row.get("OVR", "")),
        "pac": parse_int(row.get("PAC", "")),
        "sho": parse_int(row.get("SHO", "")),
        "pas": parse_int(row.get("PAS", "")),
        "dri": parse_int(row.get("DRI", "")),
        "def": parse_int(row.get("DEF", "")),
        "phy": parse_int(row.get("PHY", "")),
        "acceleration": parse_int(row.get("Acceleration", "")),
        "sprintSpeed": parse_int(row.get("Sprint Speed", "")),
        "positioning": parse_int(row.get("Positioning", "")),
        "finishing": parse_int(row.get("Finishing", "")),
        "shotPower": parse_int(row.get("Shot Power", "")),
        "longShots": parse_int(row.get("Long Shots", "")),
        "volleys": parse_int(row.get("Volleys", "")),
        "penalties": parse_int(row.get("Penalties", "")),
        "vision": parse_int(row.get("Vision", "")),
        "crossing": parse_int(row.get("Crossing", "")),
        "freeKickAccuracy": parse_int(row.get("Free Kick Accuracy", "")),
        "shortPassing": parse_int(row.get("Short Passing", "")),
        "longPassing": parse_int(row.get("Long Passing", "")),
        "curve": parse_int(row.get("Curve", "")),
        "dribbling": parse_int(row.get("Dribbling", "")),
        "agility": parse_int(row.get("Agility", "")),
        "balance": parse_int(row.get("Balance", "")),
        "reactions": parse_int(row.get("Reactions", "")),
        "ballControl": parse_int(row.get("Ball Control", "")),
        "composure": parse_int(row.get("Composure", "")),
        "interceptions": parse_int(row.get("Interceptions", "")),
        "headingAccuracy": parse_int(row.get("Heading Accuracy", "")),
        "defAwareness": parse_int(row.get("Def Awareness", "")),
        "standingTackle": parse_int(row.get("Standing Tackle", "")),
        "slidingTackle": parse_int(row.get("Sliding Tackle", "")),
        "jumping": parse_int(row.get("Jumping", "")),
        "stamina": parse_int(row.get("Stamina", "")),
        "strength": parse_int(row.get("Strength", "")),
        "aggression": parse_int(row.get("Aggression", "")),
        "gkDiving": parse_int(row.get("GK Diving", "")),
        "gkHandling": parse_int(row.get("GK Handling", "")),
        "gkKicking": parse_int(row.get("GK Kicking", "")),
        "gkPositioning": parse_int(row.get("GK Positioning", "")),
        "gkReflexes": parse_int(row.get("GK Reflexes", "")),
    }


def derive_fc24_ratings(row: dict[str, str]) -> dict[str, int | None]:
    gk = parse_int(row.get("GK", ""))
    return {
        "ovr": parse_int(row.get("Overall", "")),
        "pac": parse_int(row.get("Pace", "")),
        "sho": parse_int(row.get("Shooting", "")),
        "pas": parse_int(row.get("Passing", "")),
        "dri": parse_int(row.get("Dribbling", "")),
        "def": parse_int(row.get("Defending", "")),
        "phy": parse_int(row.get("Physicality", "")),
        "acceleration": parse_int(row.get("Acceleration", "")),
        "sprintSpeed": parse_int(row.get("Sprint", "")),
        "positioning": parse_int(row.get("Positioning", "")),
        "finishing": parse_int(row.get("Finishing", "")),
        "shotPower": parse_int(row.get("Shot", "")),
        "longShots": parse_int(row.get("Long", "")),
        "volleys": parse_int(row.get("Volleys", "")),
        "penalties": parse_int(row.get("Penalties", "")),
        "vision": parse_int(row.get("Vision", "")),
        "crossing": parse_int(row.get("Crossing", "")),
        "freeKickAccuracy": parse_int(row.get("Free", "")),
        "shortPassing": parse_int(row.get("Short Passing", row.get("Short", ""))),
        "longPassing": parse_int(row.get("Long Passing", row.get("Long", ""))),
        "curve": parse_int(row.get("Curve", "")),
        "dribbling": parse_int(row.get("Dribbling", "")),
        "agility": parse_int(row.get("Agility", "")),
        "balance": parse_int(row.get("Balance", "")),
        "reactions": parse_int(row.get("Reactions", "")),
        "ballControl": parse_int(row.get("Ball", "")),
        "composure": parse_int(row.get("Composure", "")),
        "interceptions": parse_int(row.get("Interceptions", "")),
        "headingAccuracy": parse_int(row.get("Heading", "")),
        "defAwareness": parse_int(row.get("Def", "")),
        "standingTackle": parse_int(row.get("Standing", "")),
        "slidingTackle": parse_int(row.get("Sliding", "")),
        "jumping": parse_int(row.get("Jumping", "")),
        "stamina": parse_int(row.get("Stamina", "")),
        "strength": parse_int(row.get("Strength", "")),
        "aggression": parse_int(row.get("Aggression", "")),
        "gkDiving": gk,
        "gkHandling": gk,
        "gkKicking": gk,
        "gkPositioning": gk,
        "gkReflexes": gk,
    }


def derive_fc_prev_ratings(row: dict[str, str]) -> dict[str, int | None]:
    return {
        "ovr": parse_int(row.get("overall", "")),
        "pac": parse_int(row.get("pace", "")),
        "sho": parse_int(row.get("shooting", "")),
        "pas": parse_int(row.get("passing", "")),
        "dri": parse_int(row.get("dribbling", "")),
        "def": parse_int(row.get("defending", "")),
        "phy": parse_int(row.get("physic", "")),
        "acceleration": parse_int(row.get("movement_acceleration", "")),
        "sprintSpeed": parse_int(row.get("movement_sprint_speed", "")),
        "positioning": parse_int(row.get("mentality_positioning", "")),
        "finishing": parse_int(row.get("attacking_finishing", "")),
        "shotPower": parse_int(row.get("power_shot_power", "")),
        "longShots": parse_int(row.get("power_long_shots", "")),
        "volleys": parse_int(row.get("attacking_volleys", "")),
        "penalties": parse_int(row.get("mentality_penalties", "")),
        "vision": parse_int(row.get("mentality_vision", "")),
        "crossing": parse_int(row.get("attacking_crossing", "")),
        "freeKickAccuracy": parse_int(row.get("skill_fk_accuracy", "")),
        "shortPassing": parse_int(row.get("attacking_short_passing", "")),
        "longPassing": parse_int(row.get("skill_long_passing", "")),
        "curve": parse_int(row.get("skill_curve", "")),
        "dribbling": parse_int(row.get("skill_dribbling", "")),
        "agility": parse_int(row.get("movement_acceleration", "")),
        "balance": parse_int(row.get("movement_balance", "")),
        "reactions": parse_int(row.get("movement_reactions", "")),
        "ballControl": parse_int(row.get("skill_ball_control", "")),
        "composure": parse_int(row.get("mentality_composure", "")),
        "interceptions": parse_int(row.get("mentality_interceptions", "")),
        "headingAccuracy": parse_int(row.get("attacking_heading_accuracy", "")),
        "defAwareness": parse_int(row.get("defending_marking_awareness", "")),
        "standingTackle": parse_int(row.get("defending_standing_tackle", "")),
        "slidingTackle": parse_int(row.get("defending_sliding_tackle", "")),
        "jumping": parse_int(row.get("power_jumping", "")),
        "stamina": parse_int(row.get("power_stamina", "")),
        "strength": parse_int(row.get("power_strength", "")),
        "aggression": parse_int(row.get("mentality_aggression", "")),
        "gkDiving": parse_int(row.get("gk", "")),
        "gkHandling": parse_int(row.get("gk", "")),
        "gkKicking": parse_int(row.get("gk", "")),
        "gkPositioning": parse_int(row.get("goalkeeping_positioning", "")),
        "gkReflexes": parse_int(row.get("gk", "")),
    }


def build_player_record(
    *,
    season_code: str,
    source_tag: str,
    row_index: int,
    row: dict[str, str],
    team_raw: str,
    league: str,
    position: str,
    alt_positions_raw: str,
    ratings: dict[str, int | None],
) -> dict[str, object] | None:
    team = canonical_team_name(team_raw)
    if not team:
        return None

    row_id = row.get("player_id") or row.get("ID") or row.get("Rank") or row.get("Unnamed: 0") or row.get("")
    stable_id = row_id if row_id not in (None, "") else row_index

    player = {
        "id": f"{season_code}:{source_tag}:{stable_id}",
        "rank": parse_int(row.get("Rank", row.get("overall", row.get("Overall", "")))),
        "name": row.get("Name") or row.get("short_name") or row.get("long_name") or "",
        "season": season_code,
        "team": team,
        "teamLabel": team_label(season_code, team),
        "teamKey": team_key(season_code, team),
        "league": league,
        "nation": row.get("Nation") or row.get("nation_name") or row.get("nationality_name") or "",
        "position": position,
        "altPositions": parse_alt_positions(alt_positions_raw),
        "age": parse_int(row.get("Age", row.get("age", ""))),
        "weakFoot": parse_int(row.get("Weak foot", row.get("weak_foot", ""))),
        "skillMoves": parse_int(row.get("Skill moves", row.get("skill_moves", ""))),
        "preferredFoot": row.get("Preferred foot", row.get("preferred_foot", row.get("Foot", ""))),
        "card": row.get("card", ""),
        "url": row.get("url", row.get("URL", row.get("player_url", ""))),
    }
    player.update(ratings)
    return player


def build_players_for_source(source_tag: str, source_path: Path, season_code: str | None = None) -> list[dict[str, object]]:
    if not source_path.exists():
        raise SystemExit(f"Missing source file: {source_path}")

    players: list[dict[str, object]] = []

    with source_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)

        for row_index, row in enumerate(reader, start=1):
            if source_tag == "eafc":
                if row.get("League") != "Scottish Prem":
                    continue
                resolved_season = season_code or "FC"
                resolved_season = season_label(resolved_season)
                ratings = derive_eafc26_ratings(row)
                player = build_player_record(
                    season_code=resolved_season,
                    source_tag=source_tag,
                    row_index=row_index,
                    row=row,
                    team_raw=row.get("Team", ""),
                    league="Scottish Premiership",
                    position=row.get("Position", ""),
                    alt_positions_raw=row.get("Alternative positions", ""),
                    ratings=ratings,
                )
            elif source_tag == "fc24":
                team_raw = row.get("Club", "")
                if canonical_team_name(team_raw) is None:
                    continue
                ratings = derive_fc24_ratings(row)
                player = build_player_record(
                    season_code=season_label(season_code or "FC24"),
                    source_tag=source_tag,
                    row_index=row_index,
                    row=row,
                    team_raw=team_raw,
                    league="Scottish Premiership",
                    position=row.get("Position", ""),
                    alt_positions_raw=row.get("Alternative positions", ""),
                    ratings=ratings,
                )
            else:
                season = season_label(f"FIFA{row.get('fifa_version', '')}")
                team_raw = row.get("club_name", "")
                league_name = row.get("league_name", "")
                if canonical_team_name(team_raw) is None:
                    continue
                if "scot" not in league_name.lower() and "premiership" not in league_name.lower():
                    continue
                ratings = derive_fc_prev_ratings(row)
                player = build_player_record(
                    season_code=season,
                    source_tag=source_tag,
                    row_index=row_index,
                    row=row,
                    team_raw=team_raw,
                    league="Scottish Premiership",
                    position=row.get("player_positions", "") or row.get("club_position", ""),
                    alt_positions_raw=row.get("player_positions", ""),
                    ratings=ratings,
                )

            if player:
                players.append(player)

    return players


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    raw_players: list[dict[str, object]] = []
    seasons = []

    coverage_by_season: dict[str, set[str]] = defaultdict(set)

    for spec in SOURCE_SPECS:
        raw_players.extend(build_players_for_source(spec["kind"], spec["path"], spec["season"]))

    for player in raw_players:
        coverage_by_season[player["season"]].add(player["team"])
        seasons.append(player["season"])

    seasons = sorted(set(seasons), key=season_sort_value)

    minima: dict[str, int | float | None] = {}
    maxima: dict[str, int | float | None] = {}
    for field in RATING_FIELDS:
        values = [player[field] for player in raw_players if player.get(field) is not None]
        minima[field] = min(values) if values else None
        maxima[field] = max(values) if values else None

    players = []
    for player in raw_players:
        normalized = dict(player)
        for field in RATING_FIELDS:
            normalized[field] = scale_rating(player.get(field), minima[field], maxima[field])
        players.append(normalized)

    players.sort(
        key=lambda player: (
            season_sort_value(player["season"]),
            player["teamLabel"],
            -(player.get("ovr") or -1),
            player["name"],
        )
    )

    payload = {
        "source": [spec["path"].name for spec in SOURCE_SPECS],
        "league": "Scottish Premiership",
        "seasons": seasons,
        "count": len(players),
        "coverage": {
            season: {"players": sum(1 for player in players if player["season"] == season), "teams": sorted(coverage_by_season[season])}
            for season in seasons
        },
        "players": players,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(players)} Scottish Premiership players across {len(seasons)} seasons")
    for season in seasons:
        teams = sorted(coverage_by_season[season])
        print(f"  {season}: {len(teams)} teams, {sum(1 for player in players if player['season'] == season)} players -> {', '.join(teams)}")


if __name__ == "__main__":
    main()
