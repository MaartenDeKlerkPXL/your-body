/**
 * Reference list, numbered as in docs/CONTENT.md. Phases cite these by id.
 */

export interface Source {
  id: number;
  authors: string;
  title: string;
  publication: string;
  url: string;
}

export const SOURCES: Source[] = [
  {
    id: 1,
    authors: 'Pandi-Perumal SR, Smits M, Spence W, et al.',
    title: 'Dim light melatonin onset (DLMO): a tool for the analysis of circadian phase in human sleep and chronobiological disorders',
    publication: 'Prog Neuropsychopharmacol Biol Psychiatry. 2007;31(1):1–11',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16884842/',
  },
  {
    id: 2,
    authors: 'Molina TA, Burgess HJ.',
    title: 'Calculating the dim light melatonin onset: the impact of threshold and sampling rate',
    publication: 'Chronobiol Int. 2011;28(8):714–718',
    url: 'https://doi.org/10.3109/07420528.2011.597531',
  },
  {
    id: 3,
    authors: 'Gooley JJ, et al.',
    title: 'Exposure to room light before bedtime suppresses melatonin onset and shortens melatonin duration in humans',
    publication: 'J Clin Endocrinol Metab. 2011;96(3):E463–E472',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21193540/',
  },
  {
    id: 4,
    authors: 'Phillips AJK, et al.',
    title: 'High sensitivity and interindividual variability in the response of the human circadian system to evening light',
    publication: 'PNAS. 2019;116(24):12019–12024',
    url: 'https://doi.org/10.1073/pnas.1901824116',
  },
  {
    id: 5,
    authors: 'Khalsa SBS, Jewett ME, Cajochen C, Czeisler CA.',
    title: 'A phase response curve to single bright light pulses in human subjects',
    publication: 'J Physiol. 2003;549(Pt 3):945–952',
    url: 'https://doi.org/10.1113/jphysiol.2003.040477',
  },
  {
    id: 6,
    authors: 'Stalder T, et al.',
    title: 'Assessment of the cortisol awakening response: expert consensus guidelines',
    publication: 'Psychoneuroendocrinology. 2016;63:414–432',
    url: 'https://doi.org/10.1016/j.psyneuen.2015.10.010',
  },
  {
    id: 7,
    authors: 'Fries E, Dettenborn L, Kirschbaum C.',
    title: 'The cortisol awakening response (CAR): facts and future directions',
    publication: 'Int J Psychophysiol. 2009;72(1):67–73',
    url: 'https://doi.org/10.1016/j.ijpsycho.2008.03.014',
  },
  {
    id: 8,
    authors: 'Chan S, Debono M.',
    title: 'Replication of cortisol circadian rhythm: new advances in hydrocortisone replacement therapy',
    publication: 'Ther Adv Endocrinol Metab. 2010;1(3):129–138',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3475279/',
  },
  {
    id: 9,
    authors: 'Refinetti R, Menaker M.',
    title: 'The circadian rhythm of body temperature',
    publication: 'Physiol Behav. 1992;51(3):613–637',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1523238/',
  },
  {
    id: 10,
    authors: 'Duffy JF, Dijk DJ, Klerman EB, Czeisler CA.',
    title: 'Later endogenous circadian temperature nadir relative to an earlier wake time in older people',
    publication: 'Am J Physiol. 1998;275(5):R1478–R1487',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9791064/',
  },
  {
    id: 11,
    authors: 'Kräuchi K, Cajochen C, Werth E, Wirz-Justice A.',
    title: 'Warm feet promote the rapid onset of sleep',
    publication: 'Nature. 1999;401(6748):36–37',
    url: 'https://doi.org/10.1038/43366',
  },
  {
    id: 12,
    authors: 'Monk TH.',
    title: 'The post-lunch dip in performance',
    publication: 'Clin Sports Med. 2005;24(2):e15–e23',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15892914/',
  },
  {
    id: 13,
    authors: 'Lavie P.',
    title: 'Ultrashort sleep-waking schedule. III. ‘Gates’ and ‘forbidden zones’ for sleep',
    publication: 'Electroencephalogr Clin Neurophysiol. 1986;63(5):414–425',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2420557/',
  },
  {
    id: 14,
    authors: 'Strogatz SH, Kronauer RE, Czeisler CA.',
    title: 'Circadian pacemaker interferes with sleep onset at specific times each day: role in insomnia',
    publication: 'Am J Physiol. 1987;253(1):R172–R178',
    url: 'https://doi.org/10.1152/ajpregu.1987.253.1.R172',
  },
  {
    id: 15,
    authors: 'Schmidt C, Collette F, Cajochen C, Peigneux P.',
    title: 'A time to think: circadian rhythms in human cognition',
    publication: 'Cogn Neuropsychol. 2007;24(7):755–789',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18066734/',
  },
  {
    id: 16,
    authors: 'Tassi P, Muzet A.',
    title: 'Sleep inertia',
    publication: 'Sleep Med Rev. 2000;4(4):341–353',
    url: 'https://doi.org/10.1053/smrv.2000.0098',
  },
  {
    id: 17,
    authors: 'Brooks A, Lack L.',
    title: 'A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recuperative?',
    publication: 'Sleep. 2006;29(6):831–840',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16796222/',
  },
  {
    id: 18,
    authors: 'Drust B, Waterhouse J, Atkinson G, Edwards B, Reilly T.',
    title: 'Circadian rhythms in sports performance — an update',
    publication: 'Chronobiol Int. 2005;22(1):21–44',
    url: 'https://doi.org/10.1081/CBI-200041039',
  },
  {
    id: 19,
    authors: 'Van Cauter E, Leproult R, Plat L.',
    title: 'Age-related changes in slow wave sleep and REM sleep and relationship with growth hormone and cortisol levels in healthy men',
    publication: 'JAMA. 2000;284(7):861–868',
    url: 'https://jamanetwork.com/journals/jama/fullarticle/192981',
  },
  {
    id: 20,
    authors: 'Takahashi Y, Kipnis DM, Daughaday WH.',
    title: 'Growth hormone secretion during sleep',
    publication: 'J Clin Invest. 1968;47(9):2079–2090',
    url: 'https://pubmed.ncbi.nlm.nih.gov/5675428/',
  },
  {
    id: 21,
    authors: 'StatPearls.',
    title: 'Physiology, REM Sleep',
    publication: 'NCBI Bookshelf, NBK531454',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK531454/',
  },
  {
    id: 22,
    authors: 'Crispim CA, et al.',
    title: 'Relationship between food intake and sleep pattern in healthy individuals',
    publication: 'J Clin Sleep Med. 2011;7(6):659–664',
    url: 'https://doi.org/10.5664/jcsm.1476',
  },
  {
    id: 23,
    authors: 'Windred DP, et al.',
    title: 'Sleep regularity is a stronger predictor of mortality risk than sleep duration: a prospective cohort study',
    publication: 'Sleep. 2024;47(1):zsad253',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10782489/',
  },
  {
    id: 24,
    authors: 'National Institute of General Medical Sciences (NIH).',
    title: 'Circadian Rhythms (fact sheet)',
    publication: 'nigms.nih.gov',
    url: 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms',
  },
  {
    id: 25,
    authors: 'Kerkhof GA, Van Dongen HPA.',
    title: 'Morning-type and evening-type individuals differ in the phase position of their endogenous circadian oscillator',
    publication: 'Neurosci Lett. 1996;218:153–156',
    url: 'https://pubmed.ncbi.nlm.nih.gov/8945751/',
  },
  {
    id: 26,
    authors: 'Lack L, Bailey M, Lovato N, Wright H.',
    title: 'Chronotype differences in circadian rhythms of temperature, melatonin, and sleepiness as measured in a modified constant routine protocol',
    publication: 'Nat Sci Sleep. 2009;1:1–8',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3630920/',
  },
];
