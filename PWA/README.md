# HospiNav Pro – Standard Indoor Navigation PWA

## Features
- QR anchor-based indoor positioning
- Automatic floor detection
- Map overlay with live position
- Turn-by-turn arrow rotation

## Setup
```bash
npm install
npm run dev
```

## Environment
Create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://api.hospinav.pro
```

## HTTPS
```bash
npx cloudflared tunnel --url http://localhost:3000
```

## Backend Expectation
```
GET /navigation/route
{
  "steps": [
    { "instruction": "Go straight", "direction": 0 },
    { "instruction": "Turn left", "direction": -90 }
  ]
}
```

## Notes
- Replace QR decoder with `jsqr` or `zxing`
- Add real floor maps in `/public/maps/`