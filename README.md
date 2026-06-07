A random Premier League football game, in the style of 7-0.

## Current flow

1. Open the homepage.
2. Choose a formation and mode.
3. Click play.
4. Roll a Premier League team, click one player, then lock them to a valid slot.
5. Reroll for the next player and keep building across teams.

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
