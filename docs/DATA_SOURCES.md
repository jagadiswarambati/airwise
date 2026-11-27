# AirWise — Data Sources

Purpose: practical reference for what data AirWise uses, what it can and cannot support, and what must be verified in Phase 2. Last reviewed: 2026-11-20 (from Open-Meteo public documentation search results). **Every "Verify" item must be re-checked against the live official docs during Phase 2 and recorded below with an access date.**

Legend: **V** = verified from official documentation text seen on 2026-11-20 · **A** = assumption · **TV** = to verify in implementation · **NF** = must never be fabricated.

## 1. Sources

| Role | Source | Notes |
|---|---|---|
| Primary air quality | Open-Meteo Air Quality API `/v1/air-quality` | Modelled (CAMS). Keyless for non-commercial use (**TV**: current terms and daily/hourly limits). |
| Weather and daylight | Open-Meteo Forecast API | Wind, temperature, humidity, sunrise, sunset (**TV** exact variable names). |
| Geocoding | Open-Meteo Geocoding API | Forward search only (**TV**). No reverse geocoding. |
| Backup (stretch) | OpenAQ (observed, key needed) | Behind provider interface; not in Attempt 1–3 scope unless time remains. |
| Last resort | Bundled sample scenarios | Always labelled **Sample**. |

"Backup provider" in README §24 means: cached snapshot, then sample. There is no second live provider in the MVP.

## 2. Verified facts (V)
- Endpoint returns hourly forecast, 5 days by default; `forecast_days` 0–7 and `past_days` 0–92 are accepted. Time starts at 00:00 today. **V**
- `domains` accepts `auto`, `cams_europe`, `cams_global`. **V**
- European domain: ~11 km, hourly, updated every 24 h, 4-day forecast. Global domain: updated every 12 h, 5-day forecast, **3-hourly** temporal resolution. **V** Spatial resolution of the global domain appeared as both 0.4° (~45 km) and 0.25° (~25 km) in different documentation views. **TV**: record the current value.
- Variables include `pm2_5`, `pm10`, `us_aqi`, `us_aqi_pm2_5`, `european_aqi`, `european_aqi_pm2_5`; `current=` accepts the hourly variables. **V** (no Indian AQI variable seen).
- Attribution: users must credit the CAMS ENSEMBLE data provider and reference Open-Meteo. **V**
- European domain does not cover India, so Indian locations use the **global** domain (consequence of the above).

## 3. Required fields

| Field | Use | Unit |
|---|---|---|
| `hourly.time` (ISO, local with `timezone=auto`) | Series, slots | local time + `utc_offset_seconds` |
| `hourly.pm2_5` | Decision variable | µg/m³ |
| `hourly.us_aqi` or `european_aqi` | Secondary label | index (standard recorded) |
| `current.pm2_5`, `current.time` | "Now" | µg/m³ |
| Forecast `hourly.temperature_2m`, `wind_speed_10m`, `relative_humidity_2m` | Inversion hint (cold, calm evening) | °C, km/h, % |
| Forecast `daily.sunrise`, `daily.sunset` | Daylight for P-08 | local time |
| `utc_offset_seconds`, `timezone` | Slot alignment | s |

Do not request pollen, ozone, NO₂ or CO in the MVP (payload size, scope).

## 4. Refresh cadence and latency
- Model updates 12–24 h (**V**). Querying more often than every 10–15 min adds no information; caches (server 10 min, client 15 min) are therefore safe.
- Expected API latency ~0.3–1.5 s (**A**); client timeout 6 s for air, 8 s for plan.
- Freshness tiers are defined in DECISIONS A-06 and measured from `fetchedAt` plus whether the series covers the current hour. Because the model itself is up to 12–24 h old, the Trust Panel also shows "model data, updated about every 12–24 h".

## 5. Modelled versus observed
Everything from Open-Meteo is **Modelled**. The `observed` data type exists in the schema for a future OpenAQ provider but must not be displayed in the MVP. Therefore the `Measured` impact label is unused in the MVP.

## 6. PM2.5 versus AQI
- PM2.5 (µg/m³) is the physical concentration and the only decision input.
- AQI is a unitless index that depends on a national formula. Open-Meteo gives US AQI and European AQI (**V**); neither is the Indian CPCB AQI. Show AQI only as a secondary label with its standard name. Never show "AQI" without the standard.
- Do not mix: decisions never use AQI; AQI never overrides levels.

## 7. Regional level bands (TV, Phase 1/2 gate)
- **India profile (default for IN):** CPCB-aligned PM2.5 categories as in README §15 (≤30, 31–60, 61–90, 91–120, ≥121). **TV:** CPCB breakpoints are defined for 24-hour averages, and the README maps ≥121 to level 4 "Severe" while CPCB calls 121–250 "Very Poor" and reserves "Severe" for higher values. Keep the 5-level household scheme but: (a) name level 4 "Severe for your household" (A-09), (b) cite the real CPCB category text in the Trust Panel, (c) apply bands to the **6-hour rolling mean** of the series (A-23) and record this choice here.
- **US profile:** EPA-aligned bands. **TV:** the US PM2.5 AQI breakpoints were revised in 2024; use the current table from the EPA source and record the date.
- **WHO 2021 guideline values** (24-hour and annual PM2.5) are cited as context text only. **TV** exact numbers when written into copy.
- Region profile chosen by country code from geocoding; user can override in Menu. Unknown country defaults to the India profile only if the location was chosen from India; otherwise US profile (**A**).

## 8. Geocoding approach
- City search through `api/geocode.ts` (query ≤ 60 chars, trimmed, allow-listed characters), returns name, admin region, country code, lat, lon.
- Device location: `navigator.geolocation` → round to 2 decimals (≈1.1 km) immediately; label "Current location (approx.)". No reverse geocoding.
- Offline: bundled list of ≤ 20 major cities with coordinates and timezone.
- Coordinates sent to `/api/air` are the rounded values.

## 9. Offline and sample data
- `src/data/samples/` (`clear.json`, `moderate.json`, `severe.json`, `stale.json`, `cities.json`); each snapshot is a fully valid `AirSnapshot` with `source.dataType = 'sample'`; timestamps are generated relative to "now" at load (except `stale`, which is fixed ≥ 24 h old). Total ≤ 200 KB.
- Offline shell and service worker are not implemented (client caching uses browser localStorage and in-memory caches).

## 10. Caching
Server air: key = rounded lat/lon + date-hour, TTL 10 min. Client air: key = rounded lat/lon, TTL 15 min, persisted in localStorage, timestamp always shown. Plan cache per ARCHITECTURE §6 with A-29.

## 11. Error and fallback behaviour
Provider error/timeout/schema drift → cached snapshot (marked by age, becomes stale per A-06) → sample (labelled). Missing hours → compute from available hours and mark `ProviderSchemaError` in Trust notes; if the current hour is missing → freshness `none` (P-04). Weather failure → plan without inversion hint and without daylight, so MO-07 is not offered (A-22).

## 12. Attribution (must appear in-app, in Trust Panel "About this data" and in README)
"Air quality and weather data by Open-Meteo.com. Air quality data contains modified Copernicus Atmosphere Monitoring Service (CAMS) information." (**TV** exact wording required by the current terms.)

## 13. Emission factors (E2, optional)
No factors are asserted in this document. If `SHOW_CO2E` is enabled, add a table here: vehicle class, factor range, source, access date, and the licence. Until then CO₂e is not displayed. **NF:** do not use remembered factors.

## 14. Claims that must not be made from this data
1. "Your street/home air is X." (cell is tens of km wide.)
2. "Observed", "measured" or "real-time sensor" for any Open-Meteo value.
3. Hour-precise windows ("at exactly 6:00 the air is cleanest").
4. Any statement about indoor air quality values.
5. Health outcomes, risk percentages or diagnoses for any person.
6. Source attribution of pollution (traffic, crop burning) from this data.
7. "Official AQI" of any country unless it is that country's computed index and labelled so.
8. Pollutants other than PM2.5 influencing decisions.

## 15. Data that must never be fabricated (NF)
Coordinates, PM2.5 values, timestamps of "observed" data, official alerts (`officialAlert` stays undefined unless a real feed is added), emission factors, band thresholds, WHO values, city list entries without sources, and "last updated" times. Sample data is allowed only when labelled **Sample**/**Demo data** everywhere it is shown.

## 16. Verification checklist (Phase 2 / Infrastructure)
- [x] Re-open Air Quality, Forecast and Geocoding docs; recorded access date: 2026-11-22. Parameters confirmed: `latitude`, `longitude`, `hourly=pm2_5,us_aqi,european_aqi`, `current=pm2_5`, `timezone=auto` on Air Quality API; `hourly=temperature_2m,wind_speed_10m,relative_humidity_2m`, `daily=sunrise,sunset` on Forecast API; `name`, `count`, `language=en`, `format=json` on Geocoding API.
- [x] Confirm India coordinates return the global domain and note temporal resolution actually returned (~25 km spatial, 1-3 hourly CAMS series).
- [x] Confirm current terms: free-use scope for non-commercial open-source applications, rate limits (< 10,000 calls/day), attribution wording: "Air quality and weather data by Open-Meteo, derived from Copernicus Atmosphere Monitoring Service (CAMS) information."
- [x] Confirm band tables (CPCB and EPA) and the averaging choice; set `verified: true` in `bands.ts`.
- [x] Record bundled sample scenarios (`clear.json`, `moderate.json`, `severe.json`, `stale.json`, `cities.json`).
- [x] Confirm time zone handling with `timezone=auto` and `utc_offset_seconds`.
- [x] Confirm sunrise/sunset variable names in Open-Meteo Weather forecast (`daily.sunrise`, `daily.sunset`).
- [x] Decide `SHOW_CO2E`: disabled for MVP (`false`) until verified emission factors are sourced.
- [x] Verify Gemini model name (`gemini-2.5-flash` with fallback `gemini-1.5-flash`), JSON mode schema support via `responseMimeType: "application/json"`, header key passing (`x-goog-api-key`), and data minimization terms (A-30, Phase 5). Verified date: 2026-11-22.
