# Kenya Import Duty Calculator (2025)

This is a lightweight React-based calculator for estimating Kenya import taxes for:

- Cars / vehicles
- Motorcycles
- General cargo using HS code defaults

## Project structure

- `index.html` – App shell, styles, and React/Babel script loading
- `app.js` – Main React application and tax logic

## Run locally

Because this project uses browser-loaded React + Babel (no build step), start a local static server from the project root:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173`

## Notes

- Tax rates and depreciation values are configured at the top of `app.js`.
- Current calculation year is set by `CURRENT_YEAR`.
