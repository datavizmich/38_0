A random Scottish Premiership football game, in the style of 7-0.

## Current flow

1. Open the homepage.
2. Choose a formation and mode.
3. Click play.
4. Roll a Scottish Premiership club-year, click one player, then lock them to a valid slot.
5. Reroll for the next player and keep building across teams.
6. Once the XI is complete, start the season and watch the 33-game phase, the split, and the final table.

## Starter flow

1. Build the filtered data set from `data/EAFC26-Men.csv`, `data/fc25.csv`, `data/fc24.csv`, and `data/fc_prev.csv`:

```bash
python3 scripts/build_scottish_premiership_data.py
```

2. Serve the `site/` folder with any static server:

```bash
cd site
python3 -m http.server 4173
```

The site loads the combined Scottish Premiership player JSON from `site/data/scottish-premiership-players.json`.

## Cloudflare Pages deployment

This repo is ready to deploy as a static site from the `site/` directory.

Use these Cloudflare Pages settings:

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `site`

Because `site/data/scottish-premiership-players.json` is committed, Cloudflare can publish the site without running the local Python data build during deploy.

If you change any of `data/EAFC26-Men.csv`, `data/fc25.csv`, `data/fc24.csv`, or `data/fc_prev.csv`, regenerate the filtered JSON locally before pushing:

```bash
python3 scripts/build_scottish_premiership_data.py
git add site/data/scottish-premiership-players.json
git commit -m "Update Scottish Premiership dataset"
git push
```
