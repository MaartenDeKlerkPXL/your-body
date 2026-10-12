# Your Body, Now

Een interactieve ervaring die laat zien wat je lichaam op elk uur van de dag doet, en wat je daarmee kunt doen. De site leeft mee met de klok van de bezoeker: kleur, licht, beweging en typografie veranderen met het uur. Met de 24-uursdraaiknop kun je door de dag reizen.

Gebouwd met het oog op een Awwwards Site of the Day.

## Stack

| Onderdeel | Keuze |
|---|---|
| Framework | [Astro](https://astro.build) (statische output) + TypeScript |
| Animatie | GSAP: Draggable + InertiaPlugin (draaiknop), SplitText (titels), ScrollTrigger (reveals) |
| Scroll | [Lenis](https://lenis.darkroom.engineering) smooth scroll |
| WebGL | [OGL](https://github.com/oframe/ogl) met een eigen fragment shader |
| Fonts | Bricolage Grotesque (variabel, "ademt" mee met alertheid) + Instrument Sans, self-hosted via Fontsource |
| Tests | Vitest |
| Hosting | Vercel |

## Aan de slag

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests (model, palet, contrast)
npm run build    # astro check + productie-build naar dist/
```

## Structuur

```
src/
  content/phases.ts     de 8 fases van de dag (tekst + bronverwijzingen)
  content/sources.ts    referentielijst (genummerd zoals docs/CONTENT.md)
  lib/circadian.ts      gestileerde 24u-curves: alertheid, temperatuur, cortisol, melatonine
  lib/palette.ts        kleur van de dag (OKLab), met gegarandeerd WCAG AA-contrast
  lib/form.ts           de vorm per fase (parameters voor de shader), met overgangen
  lib/time.ts           tijdhulpjes
  scripts/app.ts        regie: frame-loop, fases, URL, live/verkenmodus
  scripts/dial.ts       24u-draaiknop (slepen, gooien, toetsenbord)
  scripts/intro.ts      openingsanimatie
  scripts/journey.ts    scroll-reis: scrollpositie → tijd, reveals, voortgangsbalk
  scripts/sky.ts        WebGL-achtergrond
  components/           Dial, Curves, Journey
  pages/                index, sources
docs/
  CONTENT.md            elke wetenschappelijke claim + bron die nog moet worden toegevoegd
```

Wat er nog moet gebeuren staat in [`TODO.md`](TODO.md).

## Handig

- `?t=03:00` in de URL opent de site meteen op dat uur (deelbaar, en handig voor de jury).
- Draaiknop met toetsenbord: ←/→ ±15 min, Page Up/Down ±1 uur, Home/End begin/einde van de dag.
- `prefers-reduced-motion` wordt gerespecteerd: geen intro, geen shader-beweging, geen inertie, geen tekstanimaties.
- De openingsanimatie speelt één keer per sessie en is over te slaan met een klik, toets of scroll. Opnieuw zien: open een nieuw tabblad of wis `sessionStorage`.
