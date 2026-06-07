A random Premier League football game, in the style of 7-0.

## Current flow

1. Open the homepage.
2. Choose a formation and mode.
3. Click play.
4. Roll a Premier League team, click one player, then lock them to a valid slot.
5. Reroll for the next player and keep building across teams.
6. Once the XI is complete, start the season and watch the full league simulation.

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

## Cloudflare Pages deployment

This repo is ready to deploy as a static site from the `site/` directory.

Use these Cloudflare Pages settings:

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `site`

Because `site/data/premier-league-players.json` is committed, Cloudflare can publish the site without running the local Python data build during deploy.

If you change `data/EAFC26-Men.csv`, regenerate the filtered JSON locally before pushing:

```bash
python3 scripts/build_premier_league_data.py
git add site/data/premier-league-players.json
git commit -m "Update Premier League dataset"
git push
```
