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


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source file: {SOURCE}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with SOURCE.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        players = []

        for row in reader:
            if row.get("League") != "Scottish Prem":
                continue

            team = TEAM_RENAMES.get(row.get("Team", ""), row.get("Team", ""))

            players.append(
                {
                    "id": parse_int(row.get("ID", "")),
                    "rank": parse_int(row.get("Rank", "")),
                    "name": row.get("Name", ""),
                    "team": team,
                    "league": "Scottish Premiership",
                    "nation": row.get("Nation", ""),
                    "position": row.get("Position", ""),
                    "altPositions": parse_alt_positions(row.get("Alternative positions", "")),
                    "age": parse_int(row.get("Age", "")),
                    "ovr": parse_int(row.get("OVR", "")),
                    "pac": parse_int(row.get("PAC", "")),
                    "sho": parse_int(row.get("SHO", "")),
                    "pas": parse_int(row.get("PAS", "")),
                    "dri": parse_int(row.get("DRI", "")),
                    "def": parse_int(row.get("DEF", "")),
                    "phy": parse_int(row.get("PHY", "")),
                    "weakFoot": parse_int(row.get("Weak foot", "")),
                    "skillMoves": parse_int(row.get("Skill moves", "")),
                    "preferredFoot": row.get("Preferred foot", ""),
                    "card": row.get("card", ""),
                    "url": row.get("url", ""),
                }
            )

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
