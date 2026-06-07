A random Premier League football game, in the style of 7-0.

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
