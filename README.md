# Corset lace calculator

Works out how much lace a corset needs, and shows how to thread it.

Two uses:

- **Tightening**: the corset has another opening (a zip, for example). You enter the loop length.
- **Sliding on**: the lace is the only opening. You enter the widest gap at the shoulders, and the app calculates the minimum loop length.

Measure eyelet distances from centre to centre. Lengths work in cm or inches.

## How it works

- Eyelet spacing = lacing length / (eyelets per side - 1)
- Crossings = 2 x (eyelets per side - 2). One level is replaced by the loops.
- Crossing length = hypotenuse of the spacing and the gap when laced
- Total lace = top bar + crossings + 4 x loop length + 2 x tail length

The threading diagram is generated in code from the number of eyelets and the loop position. Full details are in [SPEC.md](./SPEC.md).

## Scripts

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run typecheck
npm run lint
npm run build
```

## Deploy on Vercel

1. Go to vercel.com and choose Add New, Project.
2. Import this GitHub repository.
3. Keep the default settings and press Deploy.
