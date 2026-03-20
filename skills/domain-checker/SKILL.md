# Domain Checker

Check domain name availability in bulk using RDAP and DNS lookups.

## API

**Base URL:** `https://domain-checker.openlabor.workers.dev`

### Endpoints

#### `GET /check?domains=example.com,example.ai`
Check availability of one or more domains (max 20 per request).

**Response:**
```json
{
  "count": 2,
  "available": 1,
  "taken": 1,
  "results": [
    { "domain": "example.com", "available": false },
    { "domain": "example.ai", "available": true }
  ]
}
```

#### `GET /tlds`
List supported TLDs with built-in RDAP servers.

**Response:**
```json
{ "supported": ["com", "net", "org", "ai", "dev", "app", "xyz", "cc", "tv"] }
```

#### `GET /`
API info and endpoint documentation.

## Usage

When asked to check if a domain is available, call the `/check` endpoint with a comma-separated list of domains. Report results clearly — which are available and which are taken.

For TLDs not in the built-in list, the API will attempt IANA RDAP bootstrap lookup, then fall back to DNS-based checking via Cloudflare DoH.

## Examples

- "Is acme.com available?" → `GET /check?domains=acme.com`
- "Check acme across .com, .ai, .dev" → `GET /check?domains=acme.com,acme.ai,acme.dev`
- "What TLDs can you check?" → `GET /tlds`
