# Inhoud & bronnen

Elke uitspraak op de site, met de bron die ze onderbouwt. Bronnen zijn peer-reviewed artikels, reviews of officiële naslagwerken. Geen blogs, geen podcasts.

**Status per claim**

| Symbool | Betekenis |
|---|---|
| ✅ | Bron gevonden en de claim komt overeen met de samenvatting (abstract) van de bron |
| 🟡 | Bron is de standaardreferentie en de claim is consistent, maar het exacte getal is nog niet in de volledige tekst nagelezen |
| ✏️ | Sitetekst aangepast zodat ze niet verder gaat dan het bewijs |

> **Hoe dit is nagekeken:** citaties (auteurs, tijdschrift, jaar, DOI/PMID) en bevindingen zijn gecontroleerd via de PubMed-, PMC- en uitgeverspagina's van elk artikel, op basis van de abstracts. De volledige teksten zijn niet gelezen. Voor de 🟡-claims: lees vóór launch de genoemde passage in de volledige tekst na.

---

## Model (`src/lib/circadian.ts`)

De curves zijn **gestileerd**: ze tonen *wanneer* iets stijgt en daalt, niet echte waarden. Aanname: volwassene die ongeveer 23:00–07:00 slaapt.

| Curve | Gemodelleerd gedrag | Bronnen | Status |
|---|---|---|---|
| Melatonine | stijgt 2–3 u vóór de gewone slaaptijd (DLMO), piek in de vroege ochtenduren, terug laag rond het ontwaken | [1], [2] | ✅ |
| Cortisol | stijgt in de late nacht, piek kort na het ontwaken (~08:30 in de klok), dieptepunt rond middernacht | [6], [7], [8] | ✅ |
| Kerntemperatuur | minimum in de vroege ochtend vóór het ontwaken, maximum laat in de namiddag / vroege avond | [9], [10] | 🟡 exacte uren |
| Alertheid | laagst in de vroege ochtend (volgt de kerntemperatuur), steile stijging na het ontwaken (slaapinertie), piek late ochtend, dip vroege namiddag, tweede piek vroege avond, "verboden zone" voor slaap enkele uren vóór bedtijd | [12], [13], [14], [15], [16] | ✅ |

### Chronotype (`src/lib/chronotype.ts`)

De toggle "Your clock" verschuift het hele model: **lichaamstijd = kloktijd − verschuiving**. Curves, fases, vormen, kleur en geluid lopen op lichaamstijd; elke tijd op het scherm blijft kloktijd.

| Claim | Bron | Status |
|---|---|---|
| Ochtend- en avondtypes verschillen 2 à 3 uur in de fase van kerntemperatuur, melatonine en slaperigheid | [25], [26] | ✅ Kerkhof & Van Dongen: ~2 u in het temperatuurritme; Lack et al.: 2–3 u in temperatuur, melatonine en slaperigheid |
| De site verschuift **±1 uur** (Early bird 22:00–06:00, In between 23:00–07:00, Night owl 00:00–08:00) | [25], [26] | ✅ bewust conservatief: het verschil tussen de uitersten in de studies, niet tussen een gemiddeld en een uitgesproken type |
| Het ritme schuift als geheel op; de vorm verandert niet | [26] | 🟡 vereenvoudiging: in [26] verschillen de types vooral in fase, niet in amplitude |

---

## Claims per fase (`src/content/phases.ts`)

### Deep night (00–03)
| Claim op de site | Bron | Status |
|---|---|---|
| Melatonine zit dicht bij zijn hoogste punt | [1], [2] | ✅ |
| De eerste helft van de nacht bevat het meeste diepe (slow-wave) slaap | [21] | ✅ |
| Veel groeihormoon komt vrij tijdens diepe slaap | [19], [20] | ✅ |
| Tip: zelfs gewoon kamerlicht kan melatonine onderdrukken | [3], [4] | ✅ ✏️ was "even dim light"; Gooley et al. tonen het voor gewoon kamerlicht. Ook "and cool" geschrapt: geen bron voor deze claim gezocht |

### Low tide (03–06)
| Claim op de site | Bron | Status |
|---|---|---|
| Kerntemperatuur bereikt haar dagminimum in de vroege ochtend, vóór je natuurlijk wakker wordt | [9], [10] | ✅ ✏️ was "a couple of hours before": dat exacte interval is niet bevestigd in de abstracts |
| De meeste REM-slaap valt in de tweede helft van de nacht | [21] | ✅ |
| Tip: geen fel scherm als je wakker ligt | [3], [5] | ✅ licht 's nachts onderdrukt melatonine en verschuift de klok |

### First light (06–09)
| Claim op de site | Bron | Status |
|---|---|---|
| Licht op je ogen helpt melatonine af te bouwen | [3] | ✅ ✏️ was "switches melatonin production off": te absoluut |
| Cortisol stijgt sterk in de eerste 30 à 45 minuten na het ontwaken | [6], [7] | 🟡 standaardreferenties voor de cortisol-ontwaakrespons; het exacte venster nalezen in de volledige tekst |
| Tip: ochtendlicht trekt je klok vroeger en houdt ze op tijd | [5] | ✅ ✏️ was "within an hour of waking": dat tijdsvenster staat niet in de bron |

### Morning peak (09–12)
| Claim op de site | Bron | Status |
|---|---|---|
| Slaapinertie trekt weg na het ontwaken | [16] | ✅ |
| Alertheid en focus stijgen door de late ochtend, voor de meeste mensen | [15] | ✅ hangt af van chronotype, wat de site ook zegt ("for most people") |

### Afternoon dip (12–15)
| Claim op de site | Bron | Status |
|---|---|---|
| De middagdip is deel van je dagritme, ook zonder maaltijd | [12] | ✅ Monk: de dip treedt ook op bij mensen die niet lunchten |
| Tip: een dutje van ongeveer 10 minuten geeft meteen meer alertheid; veel langere dutjes kunnen je suf maken | [17], [16] | ✅ ✏️ was "10 to 20 minutes … without stealing from tonight's sleep": 10 min werkte meteen, 20 min pas na ~35 min, 30 min gaf eerst sufheid. Het effect op de nachtslaap is niet onderzocht in deze studie |

### Second wind (15–18)
| Claim op de site | Bron | Status |
|---|---|---|
| Kerntemperatuur stijgt naar haar dagmaximum | [9] | ✅ |
| Reactietijd, coördinatie en spierkracht zijn op hun best laat in de namiddag | [18] | ✅ |

### Evening (18–21)
| Claim op de site | Bron | Status |
|---|---|---|
| Temperatuur piekt en begint te dalen | [9], [11] | ✅ |
| Wake maintenance zone: in de uren vóór je gewone bedtijd is inslapen het moeilijkst | [13], [14] | ✅ Lavie: "forbidden zone" ±20:00–22:00; Strogatz: 1–3 u vóór de gewone bedtijd |
| Tip: dim de lichten 's avonds en vermijd grote maaltijden vlak voor het slapen | [3], [22] | ✅ ✏️ "after sunset" geschrapt. Het maaltijdbewijs is observationeel (één studie, 52 deelnemers), dus formulering voorzichtig gehouden |

### Wind-down (21–24)
| Claim op de site | Bron | Status |
|---|---|---|
| Melatonine begint 2–3 uur vóór je gewone bedtijd te stijgen | [1], [2] | ✅ ✏️ was "about two hours": de bronnen geven 2–3 u |
| Je lichaam geeft warmte af via handen en voeten, wat inslapen voorbereidt | [11] | ✅ ✏️ toegevoegd ter vervanging van een vagere temperatuurzin |
| Tip: een regelmatige bedtijd telt, niet alleen het aantal uren | [23] | ✅ observationeel (UK Biobank, ~61.000 mensen) |

### Algemene uitspraken (footer, `/sources`, outro van de scroll-reis)
| Claim | Bron | Status |
|---|---|---|
| Licht is de belangrijkste tijdgever van de klok; chronotype verschuift de patronen | [24], [15] | ✅ |
| Outro: "Light, meals, movement and a regular bedtime keep it on time." | [24], [5], [23] | ✅ NIGMS noemt licht, voedselinname en fysieke activiteit als factoren die het ritme beïnvloeden |

De tekstversie van de grote curves (beschrijving voor schermlezers en de tabel "Show as table") wordt automatisch uit hetzelfde model afgeleid, zodat tekst en grafiek nooit uit elkaar lopen.

De trendwoorden per hoofdstuk ("rising", "falling"…) komen uit het gestileerde model hierboven, berekend op het midden van elke fase.

---

## Referenties

1. Pandi-Perumal SR, Smits M, Spence W, et al. **Dim light melatonin onset (DLMO): a tool for the analysis of circadian phase in human sleep and chronobiological disorders.** *Prog Neuropsychopharmacol Biol Psychiatry.* 2007;31(1):1–11. [PubMed 16884842](https://pubmed.ncbi.nlm.nih.gov/16884842/)
2. Molina TA, Burgess HJ. **Calculating the dim light melatonin onset: the impact of threshold and sampling rate.** *Chronobiol Int.* 2011;28(8):714–718. [doi:10.3109/07420528.2011.597531](https://doi.org/10.3109/07420528.2011.597531) · [PMC3248814](https://pmc.ncbi.nlm.nih.gov/articles/PMC3248814/)
3. Gooley JJ, et al. **Exposure to room light before bedtime suppresses melatonin onset and shortens melatonin duration in humans.** *J Clin Endocrinol Metab.* 2011;96(3):E463–E472. [PubMed 21193540](https://pubmed.ncbi.nlm.nih.gov/21193540/) · [PMC3047226](https://pmc.ncbi.nlm.nih.gov/articles/PMC3047226/)
4. Phillips AJK, et al. **High sensitivity and interindividual variability in the response of the human circadian system to evening light.** *PNAS.* 2019;116(24):12019–12024. [doi:10.1073/pnas.1901824116](https://doi.org/10.1073/pnas.1901824116)
5. Khalsa SBS, Jewett ME, Cajochen C, Czeisler CA. **A phase response curve to single bright light pulses in human subjects.** *J Physiol.* 2003;549(Pt 3):945–952. [doi:10.1113/jphysiol.2003.040477](https://doi.org/10.1113/jphysiol.2003.040477)
6. Stalder T, et al. **Assessment of the cortisol awakening response: expert consensus guidelines.** *Psychoneuroendocrinology.* 2016;63:414–432. [doi:10.1016/j.psyneuen.2015.10.010](https://doi.org/10.1016/j.psyneuen.2015.10.010)
7. Fries E, Dettenborn L, Kirschbaum C. **The cortisol awakening response (CAR): facts and future directions.** *Int J Psychophysiol.* 2009;72(1):67–73. [doi:10.1016/j.ijpsycho.2008.03.014](https://doi.org/10.1016/j.ijpsycho.2008.03.014)
8. Chan S, Debono M. **Replication of cortisol circadian rhythm: new advances in hydrocortisone replacement therapy.** *Ther Adv Endocrinol Metab.* 2010;1(3):129–138. [doi:10.1177/2042018810380214](https://doi.org/10.1177/2042018810380214) · [PMC3475279](https://pmc.ncbi.nlm.nih.gov/articles/PMC3475279/)
9. Refinetti R, Menaker M. **The circadian rhythm of body temperature.** *Physiol Behav.* 1992;51(3):613–637. [doi:10.1016/0031-9384(92)90188-8](https://doi.org/10.1016/0031-9384(92)90188-8) · [PubMed 1523238](https://pubmed.ncbi.nlm.nih.gov/1523238/)
10. Duffy JF, Dijk DJ, Klerman EB, Czeisler CA. **Later endogenous circadian temperature nadir relative to an earlier wake time in older people.** *Am J Physiol.* 1998;275(5):R1478–R1487. [doi:10.1152/ajpregu.1998.275.5.R1478](https://doi.org/10.1152/ajpregu.1998.275.5.R1478) · [PubMed 9791064](https://pubmed.ncbi.nlm.nih.gov/9791064/)
11. Kräuchi K, Cajochen C, Werth E, Wirz-Justice A. **Warm feet promote the rapid onset of sleep.** *Nature.* 1999;401(6748):36–37. [doi:10.1038/43366](https://doi.org/10.1038/43366) · [PubMed 10485703](https://pubmed.ncbi.nlm.nih.gov/10485703/)
12. Monk TH. **The post-lunch dip in performance.** *Clin Sports Med.* 2005;24(2):e15–e23. [doi:10.1016/j.csm.2004.12.002](https://doi.org/10.1016/j.csm.2004.12.002) · [PubMed 15892914](https://pubmed.ncbi.nlm.nih.gov/15892914/)
13. Lavie P. **Ultrashort sleep-waking schedule. III. 'Gates' and 'forbidden zones' for sleep.** *Electroencephalogr Clin Neurophysiol.* 1986;63(5):414–425. [doi:10.1016/0013-4694(86)90123-9](https://doi.org/10.1016/0013-4694(86)90123-9) · [PubMed 2420557](https://pubmed.ncbi.nlm.nih.gov/2420557/)
14. Strogatz SH, Kronauer RE, Czeisler CA. **Circadian pacemaker interferes with sleep onset at specific times each day: role in insomnia.** *Am J Physiol.* 1987;253(1):R172–R178. [doi:10.1152/ajpregu.1987.253.1.R172](https://doi.org/10.1152/ajpregu.1987.253.1.R172)
15. Schmidt C, Collette F, Cajochen C, Peigneux P. **A time to think: circadian rhythms in human cognition.** *Cogn Neuropsychol.* 2007;24(7):755–789. [doi:10.1080/02643290701754158](https://doi.org/10.1080/02643290701754158) · [PubMed 18066734](https://pubmed.ncbi.nlm.nih.gov/18066734/)
16. Tassi P, Muzet A. **Sleep inertia.** *Sleep Med Rev.* 2000;4(4):341–353. [doi:10.1053/smrv.2000.0098](https://doi.org/10.1053/smrv.2000.0098)
17. Brooks A, Lack L. **A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recuperative?** *Sleep.* 2006;29(6):831–840. [PubMed 16796222](https://pubmed.ncbi.nlm.nih.gov/16796222/)
18. Drust B, Waterhouse J, Atkinson G, Edwards B, Reilly T. **Circadian rhythms in sports performance — an update.** *Chronobiol Int.* 2005;22(1):21–44. [doi:10.1081/CBI-200041039](https://doi.org/10.1081/CBI-200041039)
19. Van Cauter E, Leproult R, Plat L. **Age-related changes in slow wave sleep and REM sleep and relationship with growth hormone and cortisol levels in healthy men.** *JAMA.* 2000;284(7):861–868. [JAMA](https://jamanetwork.com/journals/jama/fullarticle/192981)
20. Takahashi Y, Kipnis DM, Daughaday WH. **Growth hormone secretion during sleep.** *J Clin Invest.* 1968;47(9):2079–2090. [PubMed 5675428](https://pubmed.ncbi.nlm.nih.gov/5675428/)
21. StatPearls. **Physiology, REM Sleep.** NCBI Bookshelf. [NBK531454](https://www.ncbi.nlm.nih.gov/books/NBK531454/) · zie ook **Physiology, Sleep Stages** [NBK526132](https://www.ncbi.nlm.nih.gov/books/NBK526132/)
22. Crispim CA, et al. **Relationship between food intake and sleep pattern in healthy individuals.** *J Clin Sleep Med.* 2011;7(6):659–664. [doi:10.5664/jcsm.1476](https://doi.org/10.5664/jcsm.1476) · [PMC3227713](https://pmc.ncbi.nlm.nih.gov/articles/PMC3227713/)
23. Windred DP, et al. **Sleep regularity is a stronger predictor of mortality risk than sleep duration: a prospective cohort study.** *Sleep.* 2024;47(1):zsad253. [PMC-commentaar](https://pmc.ncbi.nlm.nih.gov/articles/PMC10782489/)
24. National Institute of General Medical Sciences (NIH). **Circadian Rhythms** (fact sheet). [nigms.nih.gov](https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms)
25. Kerkhof GA, Van Dongen HPA. **Morning-type and evening-type individuals differ in the phase position of their endogenous circadian oscillator.** *Neurosci Lett.* 1996;218(3):153–156. [PubMed 8945751](https://pubmed.ncbi.nlm.nih.gov/8945751/)
26. Lack L, Bailey M, Lovato N, Wright H. **Chronotype differences in circadian rhythms of temperature, melatonin, and sleepiness as measured in a modified constant routine protocol.** *Nat Sci Sleep.* 2009;1:1–8. [PMC3630920](https://pmc.ncbi.nlm.nih.gov/articles/PMC3630920/)

---

## Nog na te lezen vóór launch (🟡)

1. **[6]/[7]** het exacte tijdsvenster van de cortisolpiek na het ontwaken (30–45 min).
2. **[9]/[10]** de uren van het temperatuurminimum en -maximum, om de curve in `circadian.ts` eventueel bij te stellen (nu: min 04:30, max 18:00).
3. **[26]** of de types ook in amplitude verschillen, of enkel in fase (de site schuift nu alleen op).
4. Paginanummers van [17] en [20] in de volledige tekst, en de volledige auteurslijsten waar nu "et al." staat.

## Bewust vermeden

- **De "orgaanklok"** (bv. "om 1u werkt je lever het hardst"): komt uit de traditionele Chinese geneeskunde, niet wetenschappelijk onderbouwd.
- Exacte getallen voor hormoonniveaus: verschillen sterk per persoon.
- **"Een koele slaapkamer"**: populair advies, maar hier niet onderbouwd en dus geschrapt.
- Medisch advies: de site legt algemene fysiologie uit en verwijst naar een arts bij klachten.
