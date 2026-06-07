A random Premier League football game, in the style of 7-0.

## Current flow

1. Roll a Premier League team.
2. Click a player in the roster on the left.
3. Click a valid slot on the pitch to lock that player in.
4. Roll another team and keep building.

## Starter flow

1. Build the filtered data set:

```bash
python3 scripts/build_premier_league_data.py
```

2. Serve the `site/` folder with any static server:

```bash
cd site
python3 -m http.server 4173
```

The site loads the Premier League-only player JSON from `site/data/premier-league-players.json`.
