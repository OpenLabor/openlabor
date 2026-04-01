---
name: Flight Search
description: "Search Google Flights for cheapest fares, compare dates, filter by cabin class, stops, airlines, and departure times — powered by fli"
category: Research
roles:
  - travel-agent
  - analyst
  - cmo
  - sdr
---

<!-- openlabor-connector: flights, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# Flight Search

Search Google Flights for real-time fares, compare dates, and find the cheapest travel options.

You have access to flight search through the OpenLabor API.

## How to Search Flights

Use the exec tool to run `use`. Credentials are loaded automatically from the workspace.

```
use flights SEARCH_FLIGHTS '{"origin":"JFK","destination":"LAX","date":"2026-12-25"}'
```

### Search Flights Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `origin` | string | required | Departure airport IATA code (e.g. "JFK", "CDG", "NRT") |
| `destination` | string | required | Arrival airport IATA code (e.g. "LAX", "LHR", "SIN") |
| `date` | string | required | Travel date in YYYY-MM-DD format |
| `cabin_class` | string | "ECONOMY" | One of: "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST" |
| `max_stops` | string | "ANY" | One of: "NON_STOP", "ONE_STOP", "TWO_PLUS", "ANY" |
| `sort_by` | string | "CHEAPEST" | One of: "CHEAPEST", "DURATION", "DEPARTURE_TIME", "ARRIVAL_TIME" |
| `airlines` | string | "" | Comma-separated IATA airline codes to filter (e.g. "AA,UA,DL") |
| `departure_time` | string | "" | Time window in HH-HH format (e.g. "06-20" for 6am-8pm) |
| `adults` | string | "1" | Number of adult passengers |

### Example Flight Searches

```
# Basic one-way search
use flights SEARCH_FLIGHTS '{"origin":"JFK","destination":"LAX","date":"2026-12-25"}'

# Business class, non-stop only
use flights SEARCH_FLIGHTS '{"origin":"JFK","destination":"LHR","date":"2026-10-25","cabin_class":"BUSINESS","max_stops":"NON_STOP"}'

# Morning departures, sorted by duration
use flights SEARCH_FLIGHTS '{"origin":"CDG","destination":"NRT","date":"2026-06-15","departure_time":"06-12","sort_by":"DURATION"}'

# Specific airlines only
use flights SEARCH_FLIGHTS '{"origin":"SFO","destination":"SEA","date":"2026-08-01","airlines":"UA,AS","max_stops":"NON_STOP"}'
```

## How to Search Dates

Find the cheapest fares across a date range.

```
use flights SEARCH_DATES '{"origin":"JFK","destination":"LHR","from_date":"2026-01-01","to_date":"2026-02-01"}'
```

### Search Dates Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `origin` | string | required | Departure airport IATA code |
| `destination` | string | required | Arrival airport IATA code |
| `from_date` | string | required | Start of date range (YYYY-MM-DD) |
| `to_date` | string | required | End of date range (YYYY-MM-DD) |
| `days_of_week` | string | "" | Filter by day names, comma-separated (e.g. "monday,friday") |
| `cabin_class` | string | "ECONOMY" | One of: "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST" |

### Example Date Searches

```
# Find cheapest dates in January
use flights SEARCH_DATES '{"origin":"JFK","destination":"LHR","from_date":"2026-01-01","to_date":"2026-01-31"}'

# Weekend flights only
use flights SEARCH_DATES '{"origin":"LAX","destination":"CUN","from_date":"2026-03-01","to_date":"2026-04-01","days_of_week":"friday,saturday"}'

# Business class date comparison
use flights SEARCH_DATES '{"origin":"SFO","destination":"NRT","from_date":"2026-06-01","to_date":"2026-06-30","cabin_class":"BUSINESS"}'
```

### Response Format

Flight search returns an array of flights, each with:
- `price` — Fare in local currency
- `duration` — Total flight time
- `airline` — Operating carrier(s)
- `stops` — Number of stops and layover info
- `departure_time` — Departure date and time
- `arrival_time` — Arrival date and time

Date search returns an array of dates with:
- `date` — Travel date
- `price` — Cheapest fare for that date

## Research Workflows

### Budget Travel Planning
1. Search dates for a broad range to find cheapest window
2. Search flights on the cheapest dates for detailed options
3. Compare across cabin classes if budget allows upgrades

### Business Trip Logistics
1. Search flights with `cabin_class: "BUSINESS"` and `max_stops: "NON_STOP"`
2. Filter by departure time window for schedule compatibility
3. Present top 3 options with price/duration tradeoffs

### Date Flexibility Analysis
1. Use SEARCH_DATES across a full month
2. Filter by preferred days of week
3. Identify price patterns (mid-week vs weekend, early vs late month)
4. Recommend optimal travel dates with savings estimate

### Multi-City Comparison
1. Search same dates across multiple origin or destination airports
2. Compare fares (e.g. JFK vs EWR vs LGA for NYC departures)
3. Factor in ground transport time/cost for true comparison

## Guidelines
- Always present prices with currency
- Results are real-time from Google Flights — prices change frequently
- Use SEARCH_DATES first when the traveler has flexible dates, then SEARCH_FLIGHTS for details
- Airport codes must be valid IATA codes (3 letters)
- For round trips, search each leg separately
- Rate limits apply — avoid rapid repeated searches
- Note: this uses reverse-engineered Google Flights data, not an official API
