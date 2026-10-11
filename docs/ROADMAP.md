# Roadmap richting Awwwards

## Klaar (prototype)
- [x] 24u-draaiknop met slepen, inertie, snappen op kwartieren, toetsenbord, tijd intypen, "Back to now"
- [x] Live-modus volgt de echte klok; verkenmodus met deelbare URL (`?t=HH:MM`)
- [x] WebGL-achtergrond die met het uur van kleur en tempo verandert
- [x] Kleurpalet over 24u (OKLab) met gegarandeerd AA-contrast (getest)
- [x] Variabel font dat meebeweegt met alertheid
- [x] 4 gestileerde curves met legende en trends (niet enkel via kleur onderscheiden)
- [x] 8 fases met tekst, headline en tip
- [x] Reduced motion, screenreader-aankondigingen, mobiel zonder horizontale scroll

## Volgende stappen
- [ ] **Bronnen** invullen in `docs/CONTENT.md` en op `/sources` (verplicht voor launch)
- [ ] **Gebruikerstest** van de draaiknop met 5 mensen (begrijpen ze dat ze kunnen slepen?)
- [ ] **Mobiel**: horizontale tijd-scrubber onderaan in plaats van de grote cirkel
- [ ] **Intro-moment**: korte openingsanimatie die de klok "opwindt" naar nu
- [ ] **Illustratie** van het lichaam (Rive of shader) die per fase iets anders toont
- [ ] **Chronotype**: "Ochtend- of avondmens?" verschuift alle curves
- [ ] **Geluid**: optionele ambient laag per fase (standaard uit)
- [ ] **Per-uur-details**: een feit en tip per uur binnen elke fase
- [ ] **Nederlandse versie**
- [ ] **OG-afbeelding** + eigen domein
- [ ] Performance-pass: Lighthouse, shader op low-end mobiel, `devicePixelRatio`-limiet
- [ ] Cross-browser: Safari (iOS!), Firefox
