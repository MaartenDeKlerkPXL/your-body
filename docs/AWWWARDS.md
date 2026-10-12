# Awwwards-inzending

Alles wat je nodig hebt om **Your Body, Now** in te sturen voor Site of the Day. Teksten voor het formulier staan in het Engels, zodat je ze rechtstreeks kunt kopiëren.

> **Prijs en formaat.** Op [awwwards.com/submit](https://www.awwwards.com/submit/) staat een Standard Submission voor **$65**. De [FAQ](https://www.awwwards.com/faqs/) noemt **1600 × 1200 px** als ideale maat voor de hoofdafbeelding. Die FAQ is een paar jaar oud: controleer beide op het formulier zelf voor je betaalt. Je inzending blijft bewerkbaar zolang ze een draft is, niet meer zodra ze in review staat.

---

## 1. Checklist vóór je instuurt

Pas insturen als alles hieronder afgevinkt is. Je krijgt maar één beoordeling.

**Moet (P0)**
- [ ] **Eigen domein** gekoppeld in Vercel (bv. `yourbodynow.com`). Een `*.vercel.app`-adres oogt minder professioneel. Canonical en OG-afbeelding nemen het domein automatisch over bij de volgende deploy.
- [ ] **PageSpeed Insights** op de live URL ([pagespeed.web.dev](https://pagespeed.web.dev)): mobiel en desktop.
- [ ] **Echte toestellen**: iPhone (Safari), een Android-toestel (Chrome), een Mac (Safari en Firefox). Let op:
  - draaiknop en tijdbalk slepen vlot
  - scroll-reis voelt vloeiend (Lenis), geen haperende shader
  - geluid start na één tik (op iPhone: stille-modus-schakelaar uit)
- [ ] **Geluid beluisteren** op koptelefoon en speakers. Bijstellen waar nodig (`src/lib/sound.ts`).
- [ ] **Bronnen**: de 🟡-punten in `docs/CONTENT.md` nagelezen in de volledige artikels.
- [ ] **Tekst nalezen** op typfouten (Engels).
- [ ] **Deelvoorbeeld testen**: plak de live URL in [opengraph.xyz](https://www.opengraph.xyz) of de LinkedIn Post Inspector en controleer dat `og.jpg` verschijnt.

**Sterk aangeraden**
- [ ] Laat 2 à 3 mensen de site gebruiken zonder uitleg en kijk mee. Begrijpen ze dat de klok draait? Vinden ze de scroll-reis?
- [ ] Neem de video op (zie §4).

---

## 2. Formulier: teksten om te kopiëren

**Site title**
```
Your Body, Now
```

**URL**
```
https://<jouw-domein>/
```

**Short description** (één zin, voor kaartjes en lijsten)
```
What your body is doing at this very hour, and what you can do with it: an interactive 24-hour journey through your inner clock.
```

**Description**
```
Your Body, Now is an interactive journey through the human circadian rhythm. The site runs on the visitor's own clock: open it at 14:30 and you land in the afternoon dip; open it at 03:00 and you find your body at its lowest point. A 24-hour dial (a draggable timeline on phones) lets you travel through the day, and a scroll-driven story walks through eight phases, from deep night to wind-down. Early bird or night owl? One switch slides the whole rhythm an hour earlier or later.

Everything on screen follows the hour. A WebGL shader paints the sky and gives each phase its own abstract body: a breathing sphere under stars, a rising sun, crisp focus rings, a drooping drop, orbiting satellites, a sunset halo, dust drifting apart. A generative Web Audio score, made without a single audio file, changes with it. The display type takes on a weight per phase: light at night, bold at the peaks.

Every claim is backed by peer-reviewed research and listed on a sources page. Small multiples show alertness, core temperature, cortisol and melatonin across each phase, with a table view and text descriptions for screen readers, and text contrast is computed for every minute of the day.
```

**Categories / tags** (kies wat het formulier aanbiedt)
```
Interaction Design, Storytelling, WebGL, Animation, Data Visualization, Typography, Sound, Scrolling, Health, Science, Education
```

**Technologies**
```
Astro, TypeScript, GSAP (ScrollTrigger, Draggable, InertiaPlugin, SplitText), Lenis, WebGL (GLSL shaders), Web Audio API, Vercel
```

**Fonts**
```
Bricolage Grotesque (variable), Instrument Sans
```

**Colors** (de kleuren van de dag, in volgorde)

| Moment | Hex |
|---|---|
| Diepe nacht | `#0B1026` |
| Ochtend | `#FBE4CF` |
| Ochtendpiek | `#E6F1FD` |
| Gouden uur | `#FFE4BD` |
| Zonsondergang | `#3A1D3D` |
| Accent nacht | `#8A90FF` |
| Accent ochtend | `#E8592A` |
| Accent focus | `#2468E0` |

**Credits** (bevestigd)
```
Concept, design & development: Maarten De Klerk
Country: Belgium
```
Heeft iemand meegelezen (inhoud, Engels, wetenschap), vermeld die persoon dan ook. Awwwards toont credits op je profiel.

---

## 3. Beeldmateriaal (`press/`)

Alle beelden zijn gerenderd op dubbele resolutie en daarna verkleind.

**Hoofdafbeelding (1600 × 1200)**: kies er één. Mijn advies: **D**.

| Bestand | Beeld |
|---|---|
| `thumb-d-morning-peak.jpg` ⭐ | Morning peak: scherpe bol met ringen, sterkst en vult het kader |
| `thumb-e-first-light.jpg` | First light: rijzende zon met stralen |
| `thumb-c-hero-1930.jpg` | Eerste scherm 's avonds: klok met halo |
| `thumb-b-hero-1030.jpg` | Eerste scherm 's ochtends: klok met ringen |
| `thumb-a-hero-0730.jpg` | Eerste scherm bij zonsopgang |

**Desktop (2560 × 1440)**: `desktop-01-hero` … `desktop-08-sources`

**Mobiel (1170 × 2532)**: `mobile-01-hero` … `mobile-04-evening`

**Delen**: `public/og.jpg` (1200 × 630) wordt automatisch gebruikt als preview op LinkedIn, X, WhatsApp en Slack.

> De screenshots komen uit een browser zonder echte GPU. Ze zijn scherp, maar wil je ze vervangen door eigen opnames, gebruik dan dezelfde maten.

---

## 4. Video (15–30 s): zelf opnemen

Neem dit op op je eigen computer. In de testomgeving loopt de shader niet vloeiend genoeg voor een goede video. Gebruik Chrome op volledig scherm, 1920 × 1080, 60 fps (QuickTime of OBS). Het geluid kan aan, maar de meeste mensen kijken zonder.

| Tijd | Wat | Hoe |
|---|---|---|
| 0–5 s | **Intro**: zin, wijzerplaat bouwt op, de dag raast voorbij | Open een nieuw tabblad (de intro speelt één keer per sessie) |
| 5–10 s | **Draaiknop**: sleep langzaam van ochtend naar avond | Kleuren en vorm achter de klok veranderen mee |
| 10–22 s | **Scroll-reis**: Deep night → First light → Morning peak → Second wind → Evening | Scroll rustig en gelijkmatig, en laat de voortgangsbalk rechts zien |
| 22–27 s | **Mobiel**: sleep de tijdbalk | Schermopname op je iPhone |
| 27–30 s | **Einde**: logo en URL | Zwart scherm met "Your Body, Now" en het domein |

---

## 5. Wat de jury beoordeelt, en waar de site sterk staat

| Criterium | Gewicht | Waar het zit |
|---|---|---|
| Design | 40 % | Kleur per minuut van de dag, vorm per fase, variabele typografie per fase, consistente stijl |
| Usability | 30 % | Draaiknop met toetsenbord, tijdbalk op mobiel, "Back to now", deelbare `?t=`-links, reduced motion, Lighthouse a11y 100 |
| Creativity | 20 % | De site leeft op jouw klok, en op jouw chronotype; scroll = tijdreizen; generatief geluid; vorm per fase |
| Content | 10 % | 26 bronnen, tekst afgestemd op het bewijs, mini-grafieken en tabel |

**Developer Award**: kies dit ook aan. Relevante punten: semantische HTML, Lighthouse 100 voor a11y/best practices/SEO, ruwe WebGL met asynchrone shadercompilatie en adaptieve kwaliteit, gesubset font, lazy-loaded modules, contrast getest voor elke 5 minuten van de dag (unit tests).

---

## 6. Timing en promotie

- **Deel de site al vóór je instuurt**: LinkedIn, X, r/web_design, Dribbble, en je PXL-netwerk. Feedback en eerste bezoekers helpen.
- **Stuur ook in bij** CSS Design Awards, The FWA en Godly. Dat kost weinig extra moeite met hetzelfde materiaal.
- **Case study**: staat klaar als gedeeld document (link in het gesprek), klaar om te exporteren naar Medium of je portfolio. Opbouw:
  1. Het idee: een site die op jouw klok leeft
  2. De wetenschap: bronnen zoeken, tekst afstemmen op het bewijs
  3. Design: kleur per minuut (OKLab, contrast gegarandeerd), vorm per fase, typografie per fase
  4. Techniek: shader, scroll-tijd, generatief geluid, performance (57 → 82)
  5. Toegankelijkheid: tabel, beschrijvingen, reduced motion, toetsenbord
