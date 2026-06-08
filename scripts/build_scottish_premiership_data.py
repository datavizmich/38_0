#!/usr/bin/env python3
from __future__ import annotations

import ast
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "EAFC26-Men.csv"
OUTPUT = ROOT / "site" / "data" / "scottish-premiership-players.json"

TEAM_RENAMES = {
    "Dundee FC": "Dundee",
    "St. Mirren": "St Mirren",
}

RATING_FIELDS = [
    ("ovr", "OVR"),
    ("pac", "PAC"),
    ("sho", "SHO"),
    ("pas", "PAS"),
    ("dri", "DRI"),
    ("def", "DEF"),
    ("phy", "PHY"),
    ("acceleration", "Acceleration"),
    ("sprintSpeed", "Sprint Speed"),
    ("positioning", "Positioning"),
    ("finishing", "Finishing"),
    ("shotPower", "Shot Power"),
    ("longShots", "Long Shots"),
    ("volleys", "Volleys"),
    ("penalties", "Penalties"),
    ("vision", "Vision"),
    ("crossing", "Crossing"),
    ("freeKickAccuracy", "Free Kick Accuracy"),
    ("shortPassing", "Short Passing"),
    ("longPassing", "Long Passing"),
    ("curve", "Curve"),
    ("dribbling", "Dribbling"),
    ("agility", "Agility"),
    ("balance", "Balance"),
    ("reactions", "Reactions"),
    ("ballControl", "Ball Control"),
    ("composure", "Composure"),
    ("interceptions", "Interceptions"),
    ("headingAccuracy", "Heading Accuracy"),
    ("defAwareness", "Def Awareness"),
    ("standingTackle", "Standing Tackle"),
    ("slidingTackle", "Sliding Tackle"),
    ("jumping", "Jumping"),
    ("stamina", "Stamina"),
    ("strength", "Strength"),
    ("aggression", "Aggression"),
    ("gkDiving", "GK Diving"),
    ("gkHandling", "GK Handling"),
    ("gkKicking", "GK Kicking"),
    ("gkPositioning", "GK Positioning"),
    ("gkReflexes", "GK Reflexes"),
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


def scale_rating(value: int | float | None, minimum: int | float | None, maximum: int | float | None) -> int | None:
    if value is None or minimum is None or maximum is None:
        return None
    if maximum == minimum:
        return 99
    scaled = 50 + ((value - minimum) / (maximum - minimum)) * 49
    return int(round(scaled))


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source file: {SOURCE}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    raw_players = []

    with SOURCE.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)

        for row in reader:
            if row.get("League") != "Scottish Prem":
                continue

            team = TEAM_RENAMES.get(row.get("Team", ""), row.get("Team", ""))

            raw_player = {
                "id": parse_int(row.get("ID", "")),
                "rank": parse_int(row.get("Rank", "")),
                "name": row.get("Name", ""),
                "team": team,
                "league": "Scottish Premiership",
                "nation": row.get("Nation", ""),
                "position": row.get("Position", ""),
                "altPositions": parse_alt_positions(row.get("Alternative positions", "")),
                "age": parse_int(row.get("Age", "")),
                "weakFoot": parse_int(row.get("Weak foot", "")),
                "skillMoves": parse_int(row.get("Skill moves", "")),
                "preferredFoot": row.get("Preferred foot", ""),
                "card": row.get("card", ""),
                "url": row.get("url", ""),
            }

            for output_key, source_key in RATING_FIELDS:
                raw_player[output_key] = parse_int(row.get(source_key, ""))

            raw_players.append(raw_player)

    minima = {}
    maxima = {}
    for output_key, _ in RATING_FIELDS:
        values = [player[output_key] for player in raw_players if player[output_key] is not None]
        minima[output_key] = min(values) if values else None
        maxima[output_key] = max(values) if values else None

    players = []
    for player in raw_players:
        normalized = dict(player)
        for output_key, _ in RATING_FIELDS:
            normalized[output_key] = scale_rating(player[output_key], minima[output_key], maxima[output_key])
        players.append(normalized)

    players.sort(key=lambda player: (-player["ovr"], player["name"]))

    payload = {
        "source": "EAFC26-Men.csv",
        "league": "Scottish Premiership",
        "count": len(players),
        "players": players,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(players)} Scottish Premiership players")


if __name__ == "__main__":
    main()
