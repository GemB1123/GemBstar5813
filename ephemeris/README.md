# Shared NASA JPL ephemeris (EA_JPL)

One ephemeris for every Earthstrology app: NASA JPL DE441 (public domain), Sun, Moon, Mercury to Neptune, and Pluto, about 13,000 BCE to 17,000 CE.

- `jpl.js` is the module (`window.EA_JPL`). Source of truth: `src/jpl.js` in the Device repo; copy it here when it changes.
- `de441/cNNN.bin` are the data, one file per 36,864 days (about 101 years), about 360 KB each. `c+000.bin` starts at 1900 Jan 1.
- Test page: https://gemb1123.github.io/GemBstar5813/ephemeris/

Use it from any page:

```html
<script src="https://gemb1123.github.io/GemBstar5813/ephemeris/jpl.js"></script>
<script>
EA_JPL.config.bases = ['https://gemb1123.github.io/GemBstar5813/ephemeris/de441/'];
const jd = Date.now() / 864e5 + 2440587.5;                // Julian Day, UT
EA_JPL.need(jd).then(() => {
  console.log(EA_JPL.positions(jd));                     // {Sun: 230.37, Moon: ..., Pluto: ...} tropical longitudes
  console.log(EA_JPL.body('Moon', jd, {topo: {lat: 37.8, lon: -122.3}}));  // lon, lat, ra, dec, dist (AU), lonSpeed
  console.log(EA_JPL.helio('Mars', jd));                 // heliocentric lon, lat, r (AU)
});
EA_JPL.onLoad(() => redraw());                           // a new century arrived
</script>
```

Every call returns `null` while its century is not loaded; `need(jd)` returns a Promise. Phone apps can bundle just the centuries they show and fetch the rest when the user travels in time.
