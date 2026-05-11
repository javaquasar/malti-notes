# Theme Overrides

`theme.css` is the bundled theme entrypoint used by every page.

Use this folder for extracted theme override files when the theme system grows:

- `classic.css` - default warm paper theme note; variables live in `../theme.css`.
- `forest.css` - green/forest theme overrides.
- `contrast.css` - higher-contrast validation theme used to test token coverage.
- future files can define only `[data-theme="name"]` variables.

Keep shared semantic tokens in `../theme.css`; keep only per-theme values here.
