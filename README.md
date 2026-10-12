# Your Body, Now

Een interactieve ervaring die laat zien wat je lichaam op elk uur van de dag doet, en wat je daarmee kunt doen. De site leeft mee met de klok van de bezoeker: kleur, licht, beweging en typografie veranderen met het uur. Met de 24-uursdraaiknop kun je door de dag reizen.

Gebouwd met het oog op een Awwwards Site of the Day.

## Stack

| Onderdeel | Keuze |
|---|---|
| Framework | [Astro](https://astro.build) (statische output) + TypeScript |
| Animatie | GSAP: Draggable + InertiaPlugin (draaiknop), SplitText (titels), ScrollTrigger (reveals) |
| Scroll | [Lenis](https://lenis.darkroom.engineering) smooth scroll |
| Geluid | Web Audio API, volledig generatief (geen audiobestanden) |
| WebGL | gewone WebGL (geen library) met een eigen fragment shader, compileert op de achtergrond |
| Fonts | Bricolage Grotesque (variabel, subset tot de gebruikte tekens) + Instrument Sans (Fontsource), allebei self-hosted en preloaded |
| Tests | Vitest |
| Hosting | Vercel |

## Aan de slag

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests (model, palet, contrast)
npm run build    # astro check + productie-build naar dist/
```

## Performance

Lighthouse (lokale build, mediaan van 3 runs, software-GPU): **mobiel 82, desktop 84** voor performance; 100 voor accessibility, best practices en SEO. Wat er voor zorgt:

- CSS-kleurvariabelen worden ±10× per seconde bijgewerkt, niet elk frame (de shader krijgt wel elk frame)
- De scroll-reis (Lenis, ScrollTrigger) laadt als apart bestand zodra de browser even niets te doen heeft
- WebGL zonder library; de shader compileert op de achtergrond (`KHR_parallel_shader_compile`) en tekent op een lagere, adaptieve resolutie
- Het display-font is gesubset (`scripts/subset-display-font.sh`, 131 → 78 KB); beide fonts worden preloaded, CSS staat inline
- Reveals gebruiken alleen opacity, zodat koppen altijd in de toegankelijkheidsboom zitten

Draai `scripts/subset-display-font.sh` opnieuw (vereist `pip install fonttools brotli`) als er koppen bijkomen met nieuwe tekens.

## Structuur

```
src/
  content/phases.ts     de 8 fases van de dag (tekst + bronverwijzingen)
  content/sources.ts    referentielijst (genummerd zoals docs/CONTENT.md)
  lib/circadian.ts      gestileerde 24u-curves: alertheid, temperatuur, cortisol, melatonine
  lib/palette.ts        kleur van de dag (OKLab), met gegarandeerd WCAG AA-contrast
  lib/form.ts           de vorm per fase (parameters voor de shader), met overgangen
  lib/type.ts           vaste letterdikte en -breedte per fase
  lib/spark.ts          geometrie van de mini-grafieken per hoofdstuk
  lib/sound.ts          klank per fase: akkoord, filter, lucht, klokjes, puls
  lib/time.ts           tijdhulpjes
  scripts/app.ts        regie: frame-loop, fases, URL, live/verkenmodus
  scripts/dial.ts       24u-draaiknop (slepen, gooien, toetsenbord)
  scripts/scrubber.ts   tijdbalk voor telefoons (stuurt de draaiknop aan)
  scripts/intro.ts      openingsanimatie
  scripts/journey.ts    scroll-reis: scrollpositie → tijd, reveals, voortgangsbalk
  scripts/sky.ts        WebGL-achtergrond (adaptieve kwaliteit)
  scripts/ambient.ts    generatief ambient geluid (Web Audio)
  components/           Dial, Scrubber, Curves, Journey
  pages/                index, sources
docs/
  CONTENT.md            elke wetenschappelijke claim + bron die nog moet worden toegevoegd
```

Wat er nog moet gebeuren staat in [`TODO.md`](TODO.md).

## Handig

- `?t=03:00` in de URL opent de site meteen op dat uur (deelbaar, en handig voor de jury).
- Draaiknop met toetsenbord: ←/→ ±15 min, Page Up/Down ±1 uur, Home/End begin/einde van de dag.
- `prefers-reduced-motion` wordt gerespecteerd: geen intro, geen shader-beweging, geen inertie, geen tekstanimaties.
- Geluid staat standaard **uit** en start alleen na een klik op de knop linksonder. Het volgt de tijd op het scherm (draaiknop of scroll-reis) en pauzeert als het tabblad op de achtergrond staat. Op een iPhone met de stille-modus-schakelaar aan blijft Web Audio stil.
- De openingsanimatie speelt één keer per sessie en is over te slaan met een klik, toets of scroll. Opnieuw zien: open een nieuw tabblad of wis `sessionStorage`.
