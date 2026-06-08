#!/usr/bin/env python3
from __future__ import annotations

import ast
import csv
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SPECS = [
    ("FC26", ROOT / "data" / "EAFC26-Men.csv", "eafc26"),
    ("FC25", ROOT / "data" / "fc25.csv", "fc25"),
]
OUTPUT = ROOT / "site" / "data" / "scottish-premiership-players.json"

TEAM_RENAMES = {
    "Dundee FC": "Dundee",
    "St. Mirren": "St Mirren",
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
    try:
        parsed = ast.literal_eval(value)
    except (ValueError, SyntaxError):
        return []
    if isinstance(parsed, list):
        return [str(item) for item in parsed if item]
    return []


def parse_int(value: str):
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return value


def round_half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def scale_rating(value: int | float | None, minimum: int | float | None, maximum: int | float | None) -> int | None:
    if value is None or minimum is None or maximum is None:
        return None
    if maximum == minimum:
        return 99
    scaled = 50 + ((value - minimum) / (maximum - minimum)) * 49
    return round_half_up(scaled)


def season_label(season_code: str) -> str:
    return season_code


def team_key(season_code: str, team: str) -> str:
    return f"{season_code}::{team}"


def team_label(season_code: str, team: str) -> str:
    return f"{team} ({season_label(season_code)})"


def derive_fc25_ratings(row: dict[str, str]) -> dict[str, int | None]:
    return derive_eafc26_ratings(row)


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


def build_players_for_source(season_code: str, source_path: Path, source_type: str) -> list[dict[str, object]]:
    if not source_path.exists():
        raise SystemExit(f"Missing source file: {source_path}")

    players: list[dict[str, object]] = []

    with source_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)

        for row in reader:
            if row.get("League") != "Scottish Prem":
                continue

            team = TEAM_RENAMES.get(row.get("Team", ""), row.get("Team", ""))
            ratings = derive_eafc26_ratings(row) if source_type == "eafc26" else derive_fc25_ratings(row)

            player = {
                "id": parse_int(row.get("ID", row.get("", ""))),
                "rank": parse_int(row.get("Rank", row.get("", ""))),
                "name": row.get("Name", ""),
                "season": season_code,
                "team": team,
                "teamLabel": team_label(season_code, team),
                "teamKey": team_key(season_code, team),
                "league": "Scottish Premiership",
                "nation": row.get("Nation", ""),
                "position": row.get("Position", ""),
                "altPositions": parse_alt_positions(row.get("Alternative positions", "")),
                "age": parse_int(row.get("Age", "")),
                "weakFoot": parse_int(row.get("Weak foot", "")),
                "skillMoves": parse_int(row.get("Skill moves", "")),
                "preferredFoot": row.get("Preferred foot", row.get("Foot", "")),
                "card": row.get("card", ""),
                "url": row.get("url", ""),
            }

            player.update(ratings)
            players.append(player)

    return players


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    raw_players: list[dict[str, object]] = []
    seasons = []

    for season_code, source_path, source_type in SOURCE_SPECS:
        raw_players.extend(build_players_for_source(season_code, source_path, source_type))
        seasons.append(season_code)

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

    players.sort(key=lambda player: (player["season"], player["teamLabel"], -(player.get("ovr") or -1), player["name"]))

    payload = {
        "source": [spec[1].name for spec in SOURCE_SPECS],
        "league": "Scottish Premiership",
        "seasons": seasons,
        "count": len(players),
        "players": players,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(players)} Scottish Premiership players across {len(seasons)} seasons")


if __name__ == "__main__":
    main()
