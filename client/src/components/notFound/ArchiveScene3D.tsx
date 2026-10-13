import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { archiveAudio } from './ArchiveSoundSynth';

export interface LostArtifact {
  id: string;
  title: string;
  tag: string;
  message: string;
  codeSnippet?: string;
  category: 'xml' | 'json' | 'groovy' | 'idoc' | 'doc';
  color: string;
}

export const LOST_ARTIFACTS: LostArtifact[] = [
  {
    id: 'artifact-wind-groovy',
    title: 'The Wind Spirit Groovy Script',
    tag: '「 風の巻 」 WindSpirit.groovy',
    message: 'An enchanted anime wind scroll! It glides effortlessly on buoyant 3D air currents, guiding integration messages through the clouds.',
    codeSnippet: 'def Message conjureBreeze(Message msg) {\n  // Gliding freely on circular airflow\n  msg.setProperty("AnimeAirflow", "Active");\n  msg.setHeader("Element", "EmeraldWind");\n  return msg.soar();\n}',
    category: 'groovy',
    color: '#059669',
  },
  {
    id: 'artifact-azure-xml',
    title: 'The Azure Celestial Talisman',
    tag: '「 水の巻 」 CelestialRune.xsd',
    message: 'A radiant blue anime scripture imbued with aquatic mana. It validates data structures with crystalline precision.',
    codeSnippet: '<xs:schema elementForm="unbound">\n  <xs:element name="AzureTalisman">\n    <xs:attribute name="mana" val="404"/>\n    <xs:attribute name="orbit" val="circular"/>\n  </xs:element>\n</xs:schema>',
    category: 'xml',
    color: '#0284c7',
  },
  {
    id: 'artifact-violet-json',
    title: 'The Violet Arcana Grimoire',
    tag: '「 宙の巻 」 ArcaneGrimoire.json',
    message: 'An ancient violet grimoire drifting from a celestial nebula. It contains the arcane secret to resolving lost HTTP routes.',
    codeSnippet: '{\n  "spell": "Dimensional Drift",\n  "status": "Floating in Airflow",\n  "coordinates": "R=6.2, Theta=Circular",\n  "resonance": 404\n}',
    category: 'json',
    color: '#7c3aed',
  },
  {
    id: 'artifact-crimson-doc',
    title: 'The Crimson Flame Seal',
    tag: '「 炎の巻 」 CrimsonSeal.talisman',
    message: 'A fiery red anime ward inscribed with sakura flame runes. It protects the floating codex from rogue integration faults.',
    codeSnippet: '• TALISMAN: 404-FLAME\n• ELEMENT: Sakura Phoenix Fire\n• DRIFT: Buoyant Thermal Updraft\n• RESOLUTION: Return safely to ToolSAP',
    category: 'doc',
    color: '#e11d48',
  },
  {
    id: 'artifact-solar-xml',
    title: 'The Solar Alchemy Codex',
    tag: '「 光の巻 」 SunAlchemy.xslt',
    message: 'A golden yellow alchemical scroll bathed in morning sunbeams. It transmutes missing XML trees into golden paths.',
    codeSnippet: '<xsl:stylesheet version="3.0">\n  <xsl:template match="/SolarGrid">\n    <Sunbeam radiant="true">\n      <GoldAura intensity="max"/>\n    </Sunbeam>\n  </xsl:template>\n</xsl:stylesheet>',
    category: 'xml',
    color: '#d97706',
  },
  {
    id: 'artifact-jade-idoc',
    title: 'The Jade Forest IDoc Matrix',
    tag: '「 樹の巻 」 ForestMatrix.idoc',
    message: 'A mint green nature segment dancing among zero-gravity petals. It weaves SAP ERP payloads into organic harmony.',
    codeSnippet: 'SEGMENT: E1EDK_JADE\nTREE_ID: SAKURA_WOODS_04\nAURA: Luminous Green Pollen\nROUTE: Forest Airflow Orbit\nHARMONY: 100% Synced',
    category: 'idoc',
    color: '#16a34a',
  },
  {
    id: 'artifact-cyber-xml',
    title: 'The Lightning Beam XPath',
    tag: '「 雷の巻 」 LightningBeam.xpath',
    message: 'An electric cyan cyberpunk scroll crackling with high-voltage anime particles. It queries through cloud nodes at lightspeed.',
    codeSnippet: '//SkyDomain/Thunder[\n  @charge = "Overclocked" and\n  speed() > 1000\n]/convergeToCenter()',
    category: 'xml',
    color: '#2563eb',
  },
  {
    id: 'artifact-astral-json',
    title: 'The Astral Mirage Pipeline',
    tag: '「 幻の巻 」 AstralMirage.iflow',
    message: 'A lavender starlight flow diagram revealing the celestial topology of ToolSAP integration pipelines.',
    codeSnippet: '{\n  "pipeline": "Astral Mirage",\n  "constellation": "Andromeda CPI",\n  "status": "Airflow synchronized",\n  "glow": "#c084fc"\n}',
    category: 'json',
    color: '#9333ea',
  },
  {
    id: 'artifact-sakura-doc',
    title: 'The Sakura Blossom Field Notes',
    tag: '「 桜の巻 」 CherryBlossom.note',
    message: 'A lovely sakura pink parchment fluttering in the spring breeze. It offers a gentle reminder to enjoy the coding journey.',
    codeSnippet: '🌸 Spring air stream caught page\n🌸 Petals drifting in 3D orbit\n🌸 Return gently to the grimoire\n🌸 ToolSAP magic fully alive',
    category: 'doc',
    color: '#db2777',
  },
  {
    id: 'artifact-topaz-groovy',
    title: 'The Topaz Sunbeam Glyph',
    tag: '「 陽の巻 」 SolarGlyph.groovy',
    message: 'A warm amber-yellow glyph radiating cozy sunshine. It warms every developer with positive energy and clear solutions.',
    codeSnippet: 'def Message igniteDawn(Message msg) {\n  def ray = msg.spark("GoldSun");\n  ray.warmth = "Radiant Yellow";\n  return msg.glow();\n}',
    category: 'groovy',
    color: '#ea580c',
  },
];

export interface FlippablePageItem {
  group: THREE.Group;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  frontGeo: THREE.PlaneGeometry;
  backGeo: THREE.PlaneGeometry;
  progress: number; // 0.0 = right stack, 1.0 = left stack
  targetProgress: number;
  flipSpeed: number;
  isFlipping: boolean;
  landingTimer: number;
  pageIndex: number;
}

export interface AnimeFloatingPageItem {
  id: number;
  mesh: THREE.Mesh;
  baseRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  tiltX: number;
  tiltZ: number;
  phaseR: number;
  phaseY: number;
  phaseZ: number;
  currentPos: THREE.Vector3;
  repulsionOffset: THREE.Vector3;
  flutterPhase: number;
  flutterSpeed: number;
  isArtifact: boolean;
  artifact?: LostArtifact;
  baseCurvature: Float32Array;
  // Drag & Throw Physical Kinematics
  state: 'orbiting' | 'dragging' | 'thrown' | 'respawning';
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  dragOffset: THREE.Vector3;
  grabWorldPos: THREE.Vector3;
  throwTimer: number;
  respawnDelay: number;
  targetScale: number;
  currentScale: number;
  baseGlowHex: number;
}

interface ArchiveScene3DProps {
  isChaosMode: boolean;
  onTriggerChaos: () => void;
  onSelectArtifact: (artifact: LostArtifact) => void;
  reducedMotion?: boolean;
}

export function ArchiveScene3D({
  isChaosMode,
  onTriggerChaos,
  onSelectArtifact,
  reducedMotion = false,
}: ArchiveScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number>(0);

  // Interaction tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const bookClickTimesRef = useRef<number[]>([]);

  // 3D Objects
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const pageItemsRef = useRef<AnimeFloatingPageItem[]>([]);

  // Drag & Throw Mechanics tracking
  const draggedPageRef = useRef<AnimeFloatingPageItem | null>(null);
  const dragPointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedDragRef = useRef<boolean>(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragPlaneIntersectRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const pointerVelocity3DRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastPointerPos3DRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastPointerTimeRef = useRef<number>(0);

  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const blackHoleGroupRef = useRef<THREE.Group | null>(null);
  const singularityLightRef = useRef<THREE.PointLight | null>(null);
  const portalVortexMeshRef = useRef<THREE.Mesh | null>(null);
  const secondarySmokeMeshRef = useRef<THREE.Mesh | null>(null);
  const photonRingMeshRef = useRef<THREE.Mesh | null>(null);
  const vortexDustGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const vortexDustDataRef = useRef<{
    radius: number;
    angle: number;
    orbitSpeedFactor: number;
    inflowSpeed: number;
    zOffset: number;
    radialWobbleSpeed: number;
    radialWobblePhase: number;
  }[]>([]);
  const portalOpenRef = useRef<boolean>(false);
  const portalScaleRef = useRef<number>(0);
  const portalAppearProgressRef = useRef<number>(0);
  const portalCloseProgressRef = useRef<number>(0);
  const isPortalClosedRef = useRef<boolean>(false);
  const postConsumptionTimerRef = useRef<number>(0);
  const bookSuckProgressRef = useRef<number>(0);
  const isBookConsumedRef = useRef<boolean>(false);
  const bookSpineLightRef = useRef<THREE.PointLight | null>(null);
  const backdropMeshRef = useRef<THREE.Mesh | null>(null);

  // Book Hover & Interactive Opening Animation Refs
  const leftCoverRef = useRef<THREE.Mesh | null>(null);
  const rightCoverRef = useRef<THREE.Mesh | null>(null);
  const leftStackRef = useRef<THREE.Mesh | null>(null);
  const rightStackRef = useRef<THREE.Mesh | null>(null);
  const bookInnerGroupRef = useRef<THREE.Group | null>(null);
  const bookAuraLightRef = useRef<THREE.PointLight | null>(null);
  const bookHoverSparklesRef = useRef<THREE.Points | null>(null);
  const isBookHoveredRef = useRef<boolean>(false);
  const bookOpenProgressRef = useRef<number>(1.0); // 1 = fully open by default
  const hoverPerkRef = useRef<number>(0.0);
  const bookScaleRef = useRef<number>(1.28);
  const flippablePagesRef = useRef<FlippablePageItem[]>([]);
  const spineRef = useRef<THREE.Mesh | null>(null);
  const topHeadbandRef = useRef<THREE.Mesh | null>(null);
  const bottomTailbandRef = useRef<THREE.Mesh | null>(null);
  const flipSparklesRef = useRef<{
    points: THREE.Points;
    geo: THREE.BufferGeometry;
    posAttr: THREE.BufferAttribute;
    velocities: Float32Array;
    life: number;
    maxLife: number;
  } | null>(null);

  const isChaosModeRef = useRef(isChaosMode);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    isChaosModeRef.current = isChaosMode;
    if (isChaosMode) {
      portalOpenRef.current = true;
    }
  }, [isChaosMode]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Luminous Anime Grimoire & Spell Page Texture Generator (High DPI 768x1024)
  // Vibrant anime aesthetic featuring Green, Blue, Purple, Red, and Yellow palettes
  const createAnimePageTexture = useCallback((index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const ANIME_THEMES = [
      // 0: VIBRANT GREEN (Wind Spirit / Groovy)
      {
        name: 'Emerald Wind',
        jpTitle: '「 風の巻 • WIND SCROLL 」',
        badge: '★ WIND 404 ★',
        bgGradTop: '#f0fdf4',
        bgGradMid: '#dcfce7',
        bgGradBottom: '#bbf7d0',
        mainColor: '#059669',
        glowColor: '#34d399',
        accentDark: '#047857',
        runicSymbol: '風',
        title: 'WindSpirit.groovy',
        tag: 'ANIME CPI // ELEMENTAL SCRIPT',
        lines: [
          { t: 'import com.anime.ip.WindFlow;', c: '#047857' },
          { t: '', c: '#047857' },
          { t: 'def Message conjureBreeze(Message msg) {', c: '#065f46' },
          { t: '    def spirit = msg.summon("WindAura");', c: '#0f766e' },
          { t: '    spirit.glide("Airflow Orbit active");', c: '#059669' },
          { t: '    msg.setProperty("AnimeVibe", "100%");', c: '#047857' },
          { t: '    msg.setHeader("FlowVector", "Circular");', c: '#0f766e' },
          { t: '    return msg.soar();', c: '#065f46' },
          { t: '}', c: '#065f46' },
        ],
        stamp: 'WIND SEAL',
      },
      // 1: ELECTRIC CYAN BLUE (Azure Rune / XML)
      {
        name: 'Azure Celestial',
        jpTitle: '「 水の巻 • AZURE SCRIPTURE 」',
        badge: '★ AZURE 404 ★',
        bgGradTop: '#f0f9ff',
        bgGradMid: '#e0f2fe',
        bgGradBottom: '#bae6fd',
        mainColor: '#0284c7',
        glowColor: '#38bdf8',
        accentDark: '#0369a1',
        runicSymbol: '水',
        title: 'CelestialRune.xsd',
        tag: 'W3C RUNES // AZURE PROTOCOL',
        lines: [
          { t: '<?xml version="1.0" encoding="UTF-8"?>', c: '#0369a1' },
          { t: '<xs:schema elementForm="unbound">', c: '#0284c7' },
          { t: '  <xs:element name="AzureTalisman">', c: '#075985' },
          { t: '    <xs:complexType>', c: '#0369a1' },
          { t: '      <xs:attribute name="mana" val="404"/>', c: '#0284c7' },
          { t: '      <xs:attribute name="orbit" val="circular"/>', c: '#0369a1' },
          { t: '      <xs:attribute name="status" val="soaring"/>', c: '#075985' },
          { t: '    </xs:complexType>', c: '#0369a1' },
          { t: '  </xs:element>', c: '#075985' },
          { t: '</xs:schema>', c: '#0369a1' },
        ],
        stamp: 'AZURE SEAL',
      },
      // 2: ROYAL VIOLET PURPLE (Arcana / JSON Grimoire)
      {
        name: 'Violet Arcana',
        jpTitle: '「 宙の巻 • VIOLET SPELL 」',
        badge: '★ ARCANA 404 ★',
        bgGradTop: '#faf5ff',
        bgGradMid: '#ede9fe',
        bgGradBottom: '#ddd6fe',
        mainColor: '#7c3aed',
        glowColor: '#c084fc',
        accentDark: '#6d28d9',
        runicSymbol: '宙',
        title: 'ArcaneGrimoire.json',
        tag: 'GRIMOIRE API // VIOLET ARCANA',
        lines: [
          { t: '{', c: '#4c1d95' },
          { t: '  "spell": "Dimensional Drift",', c: '#7c3aed' },
          { t: '  "caster": "ToolSAP Archivist",', c: '#6d28d9' },
          { t: '  "status": "Floating in Airflow",', c: '#8b5cf6' },
          { t: '  "coordinates": {', c: '#4c1d95' },
          { t: '    "radius": "Circular Dynamic",', c: '#7c3aed' },
          { t: '    "resonance": 404', c: '#6d28d9' },
          { t: '  }', c: '#4c1d95' },
          { t: '}', c: '#4c1d95' },
        ],
        stamp: 'ARCANE SEAL',
      },
      // 3: CRIMSON FLAME RED (Fire Talisman / Doc)
      {
        name: 'Crimson Flame',
        jpTitle: '「 炎の巻 • FLAME TALISMAN 」',
        badge: '★ FLAME 404 ★',
        bgGradTop: '#fff1f2',
        bgGradMid: '#ffe4e6',
        bgGradBottom: '#fecdd3',
        mainColor: '#e11d48',
        glowColor: '#fb7185',
        accentDark: '#be123c',
        runicSymbol: '炎',
        title: 'CrimsonSeal.talisman',
        tag: 'ANIME WARD // SAKURA PHOENIX',
        lines: [
          { t: '★ TALISMAN CODE: 404-FLAME', c: '#9f1239' },
          { t: '★ ELEMENT: Sakura Phoenix Fire', c: '#be123c' },
          { t: '★ WARD: Protect floating codex pages', c: '#e11d48' },
          { t: '★ DRIFT: Buoyant upward thermals', c: '#be123c' },
          { t: '★ AURA: 100% Luminous Crimson Radiance', c: '#e11d48' },
          { t: '★ SEAL: Active Anime Dimension Barrier', c: '#9f1239' },
        ],
        stamp: 'FLAME SEAL',
      },
      // 4: GOLDEN SOLAR YELLOW (Sun Alchemy / XSLT)
      {
        name: 'Solar Alchemy',
        jpTitle: '「 光の巻 • SOLAR ALCHEMY 」',
        badge: '★ SOLAR 404 ★',
        bgGradTop: '#fefce8',
        bgGradMid: '#fef9c3',
        bgGradBottom: '#fef08a',
        mainColor: '#d97706',
        glowColor: '#facc15',
        accentDark: '#b45309',
        runicSymbol: '光',
        title: 'SunAlchemy.xslt',
        tag: 'ALCHEMICAL CODEX // SOLAR GLYPH',
        lines: [
          { t: '<?xml version="1.0" encoding="UTF-8"?>', c: '#92400e' },
          { t: '<xsl:stylesheet version="3.0">', c: '#b45309' },
          { t: '  <xsl:template match="/SolarGrid">', c: '#d97706' },
          { t: '    <Sunbeam radiant="true">', c: '#b45309' },
          { t: '      <GoldAura intensity="max"/>', c: '#d97706' },
          { t: '      <FlowPath val="Random Circular"/>', c: '#92400e' },
          { t: '    </Sunbeam>', c: '#b45309' },
          { t: '  </xsl:template>', c: '#d97706' },
          { t: '</xsl:stylesheet>', c: '#92400e' },
        ],
        stamp: 'SOLAR SEAL',
      },
      // 5: MINT JADE GREEN (Forest Matrix / IDoc)
      {
        name: 'Mint Jade',
        jpTitle: '「 樹の巻 • JADE FLOW 」',
        badge: '★ JADE 404 ★',
        bgGradTop: '#f0fdf4',
        bgGradMid: '#dcfce7',
        bgGradBottom: '#bbf7d0',
        mainColor: '#16a34a',
        glowColor: '#4ade80',
        accentDark: '#15803d',
        runicSymbol: '樹',
        title: 'ForestMatrix.idoc',
        tag: 'NATURE MATRIX // SAP EDI CODEX',
        lines: [
          { t: 'SEGMENT: E1EDK_JADE // VER. 404', c: '#166534' },
          { t: 'TREE_ID: SAKURA_WOODS_04', c: '#15803d' },
          { t: 'AURA: Luminous Green Pollen', c: '#16a34a' },
          { t: 'ROUTE: Forest Airflow Orbit', c: '#15803d' },
          { t: 'SYNC: 100% Organic Harmony', c: '#166534' },
          { t: 'PORTAL: Safe from Singularities', c: '#15803d' },
        ],
        stamp: 'JADE SEAL',
      },
      // 6: ELECTRIC SAPPHIRE BLUE (Lightning Beam / XPath)
      {
        name: 'Electric Cyan',
        jpTitle: '「 雷の巻 • LIGHTNING TRACE 」',
        badge: '★ CYBER 404 ★',
        bgGradTop: '#eff6ff',
        bgGradMid: '#dbeafe',
        bgGradBottom: '#bfdbfe',
        mainColor: '#2563eb',
        glowColor: '#60a5fa',
        accentDark: '#1d4ed8',
        runicSymbol: '雷',
        title: 'LightningBeam.xpath',
        tag: 'HIGH VOLTAGE // CELESTIAL BEAM',
        lines: [
          { t: '//SkyDomain/Thunder[', c: '#1e40af' },
          { t: '  @charge = "Overclocked" and', c: '#1d4ed8' },
          { t: '  speed() > 1000 and', c: '#2563eb' },
          { t: '  airflowPath() = "CircularSpiral"', c: '#1d4ed8' },
          { t: ']/convergeToCenter()', c: '#2563eb' },
          { t: '★ RETURN: FlashToHome()', c: '#1e40af' },
        ],
        stamp: 'THUNDER SEAL',
      },
      // 7: ASTRAL LAVENDER PURPLE (Nebula Map / Diagram)
      {
        name: 'Astral Lavender',
        jpTitle: '「 幻の巻 • ASTRAL MIRAGE 」',
        badge: '★ ASTRAL 404 ★',
        bgGradTop: '#faf5ff',
        bgGradMid: '#f3e8ff',
        bgGradBottom: '#e9d5ff',
        mainColor: '#9333ea',
        glowColor: '#d8b4fe',
        accentDark: '#7e22ce',
        runicSymbol: '幻',
        title: 'AstralMirage.iflow',
        tag: 'COSMIC TOPOLOGY // ANIME MAP',
        isDiagram: true,
        lines: [],
        stamp: 'ASTRAL SEAL',
      },
      // 8: SAKURA BLOSSOM RED/PINK (Cherry Petal / Field Note)
      {
        name: 'Sakura Petal',
        jpTitle: '「 桜の巻 • SAKURA PETAL 」',
        badge: '★ SAKURA 404 ★',
        bgGradTop: '#fff1f2',
        bgGradMid: '#fce7f3',
        bgGradBottom: '#fbcfe8',
        mainColor: '#db2777',
        glowColor: '#f472b6',
        accentDark: '#be185d',
        runicSymbol: '桜',
        title: 'CherryBlossom.note',
        tag: 'SPRING BREEZE // DEVELOPER FIELD NOTES',
        lines: [
          { t: '🌸 Spring air stream caught this page', c: '#9d174d' },
          { t: '🌸 Petals drifting in gentle 3D orbit', c: '#be185d' },
          { t: '🌸 Curved edges fluttering in the breeze', c: '#db2777' },
          { t: '🌸 Return gently to the grimoire', c: '#be185d' },
          { t: '🌸 ToolSAP magic fully alive & soaring', c: '#9d174d' },
        ],
        stamp: 'SAKURA SEAL',
      },
      // 9: AMBER TOPAZ YELLOW (Sunbeam / Gold Glyph)
      {
        name: 'Topaz Solar',
        jpTitle: '「 陽の巻 • SUNBEAM GLYPH 」',
        badge: '★ AMBER 404 ★',
        bgGradTop: '#fffbeb',
        bgGradMid: '#fef3c7',
        bgGradBottom: '#fde68a',
        mainColor: '#ea580c',
        glowColor: '#fbbf24',
        accentDark: '#c2410c',
        runicSymbol: '陽',
        title: 'SolarGlyph.groovy',
        tag: 'SOLAR GLYPH // CPI ILLUMINATION',
        lines: [
          { t: 'def Message igniteDawn(Message msg) {', c: '#9a3412' },
          { t: '    def ray = msg.spark("GoldSun");', c: '#c2410c' },
          { t: '    ray.warmth = "Radiant Yellow";', c: '#ea580c' },
          { t: '    ray.curve = "Organic Airflow";', c: '#c2410c' },
          { t: '    return msg.glow();', c: '#9a3412' },
          { t: '}', c: '#9a3412' },
        ],
        stamp: 'SOLAR SEAL',
      },
    ];

    const currentTheme = ANIME_THEMES[index % ANIME_THEMES.length];

    // 1. Soft Pastel Anime Cel Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 768, 1024);
    bgGrad.addColorStop(0, currentTheme.bgGradTop);
    bgGrad.addColorStop(0.5, currentTheme.bgGradMid);
    bgGrad.addColorStop(1, currentTheme.bgGradBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 768, 1024);

    // 2. Sparkling Anime Starlight Glints & Crosses
    ctx.fillStyle = currentTheme.glowColor + '55';
    const sparkles = [
      { x: 90, y: 130, s: 7 },
      { x: 670, y: 150, s: 9 },
      { x: 120, y: 480, s: 6 },
      { x: 650, y: 620, s: 8 },
      { x: 220, y: 920, s: 7 },
      { x: 550, y: 930, s: 10 },
    ];
    sparkles.forEach((sp) => {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.beginPath();
      ctx.arc(0, 0, sp.s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Cross sparkle beams
      ctx.strokeStyle = currentTheme.glowColor + '88';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-sp.s, 0);
      ctx.lineTo(sp.s, 0);
      ctx.moveTo(0, -sp.s);
      ctx.lineTo(0, sp.s);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Large Translucent Anime Elemental Kanji Watermark
    ctx.save();
    ctx.font = '900 240px "Hiragino Kaku Gothic Pro", "Yu Gothic", sans-serif';
    ctx.fillStyle = currentTheme.glowColor + '18';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentTheme.runicSymbol, 384, 560);
    ctx.restore();

    // 4. Double Glowing Anime Cel Frame
    ctx.save();
    // Outer glowing border
    ctx.strokeStyle = currentTheme.mainColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = currentTheme.glowColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(32, 32, 704, 960, 24);
    ctx.stroke();

    // Inner fine filigree border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = currentTheme.mainColor + '66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(46, 46, 676, 932, 18);
    ctx.stroke();

    // Corner decorative diamond star ornaments
    const corners = [
      { x: 46, y: 46 },
      { x: 722, y: 46 },
      { x: 46, y: 978 },
      { x: 722, y: 978 },
    ];
    corners.forEach((c) => {
      ctx.fillStyle = currentTheme.mainColor;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 6);
      ctx.lineTo(c.x + 6, c.y);
      ctx.lineTo(c.x, c.y + 6);
      ctx.lineTo(c.x - 6, c.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // 5. Anime Header: Japanese Subtitle & Luminous Level Badge
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = currentTheme.accentDark;
    ctx.fillText(currentTheme.jpTitle, 72, 84);

    ctx.font = '11px monospace';
    ctx.fillStyle = currentTheme.mainColor + 'cc';
    ctx.fillText(currentTheme.tag, 72, 104);

    // Glowing Pill Badge (Top Right)
    const badgeW = 110;
    const badgeH = 26;
    const bx = 582;
    const by = 70;
    ctx.fillStyle = currentTheme.glowColor + '28';
    ctx.strokeStyle = currentTheme.mainColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = currentTheme.accentDark;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentTheme.badge, bx + badgeW / 2, by + 17);
    ctx.textAlign = 'left';

    // 6. Title & Glowing Decorative Anime Divider
    ctx.fillStyle = currentTheme.accentDark;
    ctx.font = 'bold 24px Georgia, "Yu Mincho", serif';
    ctx.fillText(currentTheme.title, 72, 150);

    ctx.strokeStyle = currentTheme.mainColor + '55';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(72, 170);
    ctx.lineTo(696, 170);
    ctx.stroke();

    // Center divider diamond
    ctx.fillStyle = currentTheme.mainColor;
    ctx.beginPath();
    ctx.moveTo(384, 164);
    ctx.lineTo(390, 170);
    ctx.lineTo(384, 176);
    ctx.lineTo(378, 170);
    ctx.closePath();
    ctx.fill();

    // 7. Anime Content: Stylized Neon Flowchart or Code Block
    if (currentTheme.isDiagram) {
      const drawAnimeNode = (x: number, y: number, w: number, h: number, title: string, sub: string, col: string) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(title, x + 18, y + 28);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText(sub, x + 18, y + 48);

        // Glowing node port
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x + w, y + h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      };

      const drawAnimeWire = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.strokeStyle = currentTheme.mainColor;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawAnimeNode(100, 230, 210, 72, '★ Celestial Trigger', 'orbit: continuous', currentTheme.mainColor);
      drawAnimeWire(310, 266, 410, 266);
      drawAnimeNode(410, 230, 240, 72, '🌀 Airflow Modifier', 'path: circular 3D', '#0284c7');

      drawAnimeWire(530, 302, 530, 390);
      drawAnimeNode(410, 390, 240, 72, '🌸 Sakura Router', 'eval: anime vibe', '#e11d48');

      drawAnimeWire(410, 426, 310, 520);
      drawAnimeNode(100, 490, 210, 72, '✨ Magic Buffer', 'status: active', '#d97706');

      drawAnimeWire(530, 462, 530, 560);
      drawAnimeNode(410, 560, 240, 72, '🌟 Grimoire Harmony', 'sync: 100%', currentTheme.mainColor);
    } else {
      ctx.font = '15px "SF Mono", Monaco, Consolas, monospace';
      let startY = 230;
      const lineHeight = 38;

      currentTheme.lines.forEach((line, lIdx) => {
        const lineNumStr = String(lIdx + 1).padStart(2, '0');
        ctx.fillStyle = currentTheme.mainColor + '77';
        ctx.fillText(lineNumStr, 74, startY);

        ctx.fillStyle = line.c;
        ctx.fillText(line.t, 114, startY);

        startY += lineHeight;
      });
    }

    // 8. Bottom Authentic Japanese Hanko Seal (Vermilion Archivist Stamp)
    ctx.save();
    ctx.translate(610, 840);
    ctx.rotate(-0.1);
    ctx.strokeStyle = currentTheme.mainColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-45, -45, 90, 90);
    ctx.strokeRect(-39, -39, 78, 78);

    ctx.fillStyle = currentTheme.mainColor;
    ctx.font = 'bold 15px "Hiragino Mincho Pro", serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOOLSAP', 0, -14);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('404', 0, 10);
    ctx.font = 'bold 10px monospace';
    ctx.fillText(currentTheme.stamp, 0, 26);
    ctx.restore();

    // 9. Bottom Footer
    ctx.fillStyle = currentTheme.accentDark + '99';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOOLSAP ARCHIVES // ANIME CODEX • AIRFLOW ORBIT ACTIVE', 72, 960);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }, []);

  // Soft Radial Drop Shadow Texture
  const createShadowTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Photorealistic Leather Book Cover Texture with Gold Foil Stamping
  const createRealisticBookCoverTexture = useCallback((isFront: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d')!;

    // 1. Rich Midnight Sapphire Leather Background
    const bgGrad = ctx.createRadialGradient(512, 700, 100, 512, 700, 900);
    bgGrad.addColorStop(0, '#1e3a8a');
    bgGrad.addColorStop(0.6, '#172554');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // 2. Fine Leather Buckram Grain Noise
    const imgData = ctx.getImageData(0, 0, 1024, 1400);
    const data = imgData.data;
    let seed = 42;
    const pseudoRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < data.length; i += 4) {
      if ((i >> 2) % 3 === 0) {
        const noise = (pseudoRand() - 0.5) * 16;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Leather Spine Hinge Groove (French groove indent)
    const hingeX = isFront ? 60 : 964;
    const grooveGrad = ctx.createLinearGradient(hingeX - 16, 0, hingeX + 16, 0);
    grooveGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grooveGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    grooveGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)');
    grooveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grooveGrad;
    ctx.fillRect(hingeX - 16, 0, 32, 1400);

    // 4. Gold Foil Double Filigree Border
    const pad = 90;
    const bW = 1024 - pad * 2;
    const bH = 1400 - pad * 2;

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(pad, pad, bW, bH);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 12, pad + 12, bW - 24, bH - 24);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad + 28, pad + 28, bW - 56, bH - 56);

    // Corner Filigree Ornaments
    const drawCornerFlourish = (cx: number, cy: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#fbbf24';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(40, 40, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawCornerFlourish(pad + 28, pad + 28, 0);
    drawCornerFlourish(pad + bW - 28, pad + 28, Math.PI / 2);
    drawCornerFlourish(pad + bW - 28, pad + bH - 28, Math.PI);
    drawCornerFlourish(pad + 28, pad + bH - 28, (Math.PI * 3) / 2);

    if (isFront) {
      // 5. Center Gold Foil Stamped Medallion & '404' (Sole text on cover)
      const centerX = 512;
      const centerY = 700;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 160, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 146, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < 24; a++) {
        const angle = (a * Math.PI * 2) / 24;
        const x1 = centerX + Math.cos(angle) * 148;
        const y1 = centerY + Math.sin(angle) * 148;
        const x2 = centerX + Math.cos(angle) * 158;
        const y2 = centerY + Math.sin(angle) * 158;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const innerGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 140);
      innerGrad.addColorStop(0, '#1d4ed8');
      innerGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 142, 0, Math.PI * 2);
      ctx.fill();

      // Radiant 3D Gold Foil Stamped '404' Emblem - Sole text on cover
      ctx.shadowColor = 'rgba(251, 191, 36, 0.75)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#fef08a';
      ctx.font = '900 120px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('404', centerX, centerY - 2);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else {
      // Back Cover: Geometric Archival Seal & Barcode
      const centerX = 512;
      const centerY = 700;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(centerX - 90, centerY - 90, 180, 180);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-75, -75, 150, 150);
      ctx.restore();

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 50px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', centerX, centerY);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 160, 1080, 320, 100);

      ctx.fillStyle = '#0f172a';
      let bx = centerX - 140;
      while (bx < centerX + 140) {
        const bw = (bx % 7 === 0 || bx % 11 === 0) ? 4 : 2;
        ctx.fillRect(bx, 1095, bw, 60);
        bx += bw + (bx % 5 === 0 ? 4 : 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Photorealistic Open Page Spread (Only 'PAGE NOT FOUND' boldly stamped and clearly visible)
  const createRealisticOpenPageTexture = useCallback((side: 'left' | 'right') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d')!;

    // 1. Warm Archival Rag Paper Base
    const paperGrad = ctx.createRadialGradient(512, 700, 200, 512, 700, 900);
    paperGrad.addColorStop(0, '#fefdfa');
    paperGrad.addColorStop(0.7, '#faf6ec');
    paperGrad.addColorStop(1, '#f3ecd8');
    ctx.fillStyle = paperGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // 2. Paper Fiber Stipple Noise
    const imgData = ctx.getImageData(0, 0, 1024, 1400);
    const data = imgData.data;
    let seed = side === 'left' ? 101 : 202;
    const pseudoRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < data.length; i += 4) {
      if ((i >> 2) % 2 === 0) {
        const noise = (pseudoRand() - 0.5) * 8;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Ambient Occlusion Gutter Crease Shadow (realistic depth at inner spine fold)
    const shadowStart = side === 'left' ? 820 : 0;
    const shadowWidth = 204;
    const gutterShadow = ctx.createLinearGradient(
      shadowStart,
      0,
      shadowStart + shadowWidth,
      0
    );
    if (side === 'left') {
      gutterShadow.addColorStop(0, 'rgba(30, 20, 10, 0)');
      gutterShadow.addColorStop(0.7, 'rgba(30, 20, 10, 0.18)');
      gutterShadow.addColorStop(1, 'rgba(20, 10, 5, 0.45)');
    } else {
      gutterShadow.addColorStop(0, 'rgba(20, 10, 5, 0.45)');
      gutterShadow.addColorStop(0.3, 'rgba(30, 20, 10, 0.18)');
      gutterShadow.addColorStop(1, 'rgba(30, 20, 10, 0)');
    }
    ctx.fillStyle = gutterShadow;
    ctx.fillRect(shadowStart, 0, shadowWidth, 1400);

    // 4. Optical Center for Text (offset slightly away from the spine gutter)
    const centerX = side === 'left' ? 470 : 554;
    const centerY = 700;

    // 5. '404 PAGE NOT FOUND' - Bold, crisp, high-contrast, perfectly centered
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a'; // Deep obsidian black ink

    // Letterpress subtle physical ink stamp depth
    ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    ctx.font = '900 180px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('404', centerX, centerY - 140);

    ctx.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('PAGE', centerX, centerY + 15);

    ctx.font = '900 92px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('NOT FOUND', centerX, centerY + 145);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }, []);

  // Photorealistic Layered Paper Edges Texture with Gilded Top Sheen
  const createRealisticPageEdgesTexture = useCallback((isTop = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f8f5ee';
    ctx.fillRect(0, 0, 256, 512);

    for (let y = 0; y < 512; y++) {
      const isDark = (y * 17) % 7 === 0;
      const isMedium = (y * 23) % 5 === 0;
      if (isDark) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      } else if (isMedium) {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      }
      ctx.fillRect(0, y, 256, 1);
    }

    if (isTop) {
      const goldGrad = ctx.createLinearGradient(0, 0, 0, 512);
      goldGrad.addColorStop(0, 'rgba(217, 119, 6, 0.9)');
      goldGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.7)');
      goldGrad.addColorStop(1, 'rgba(217, 119, 6, 0.4)');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, 256, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Photorealistic Raised Rib Spine Texture with Gold Stamping
  const createRealisticSpineTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1024);

    const ribYs = [180, 380, 580, 780];
    ribYs.forEach((ry) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, ry - 14, 256, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, ry - 8, 256, 4);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(20, ry);
      ctx.lineTo(236, ry);
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, ry + 4);
      ctx.lineTo(236, ry + 4);
      ctx.stroke();
    });

    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';

    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText('404', 128, 500);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Photorealistic Woven Headband Cord Texture
  const createRealisticHeadbandTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#fbbf24';
    const stripeW = 16;
    for (let x = -128; x < 256; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW + 128, 128);
      ctx.lineTo(x + 128, 128);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }, []);

  // Dark Gravitational Space Backdrop Vignette (Dense, smoky obsidian background)
  const createDarkBackdropTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 254);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.88)'); // Deep obsidian dark core
    grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.68)'); // Dense slate smoke
    grad.addColorStop(0.65, 'rgba(30, 41, 59, 0.38)'); // Smokey charcoal plume
    grad.addColorStop(0.85, 'rgba(51, 65, 85, 0.16)'); // Soft dissipation
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)'); // Seamless blend to site background

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Photorealistic Dense & Smokey Cosmic Portal Texture (Fixed, deep, dense volumetric smoke)
  const createDenseSmokeyPortalTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const cx = 512;
    const cy = 512;
    const innerR = 140; // Event horizon radius for compact, neat portal
    const outerR = 510; // Outer smoky shroud boundary

    ctx.clearRect(0, 0, 1024, 1024);

    // 1. Deep Volumetric Base Radial Gradient (Dense Charcoal & Midnight Smoke)
    const radGrad = ctx.createRadialGradient(cx, cy, innerR - 10, cx, cy, outerR);
    radGrad.addColorStop(0, 'rgba(2, 6, 23, 1)'); // Absolute obsidian black core edge
    radGrad.addColorStop(0.08, 'rgba(15, 23, 42, 0.98)'); // Dense dark slate
    radGrad.addColorStop(0.25, 'rgba(30, 41, 59, 0.95)'); // Heavy charcoal smoke
    radGrad.addColorStop(0.50, 'rgba(51, 65, 85, 0.85)'); // Rich dark smoke clouds
    radGrad.addColorStop(0.72, 'rgba(71, 85, 105, 0.55)'); // Diffuse billow
    radGrad.addColorStop(0.90, 'rgba(100, 116, 139, 0.22)'); // Soft edge mist
    radGrad.addColorStop(1, 'rgba(2, 6, 23, 0)'); // Seamless soft fade
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fill();

    // 2. Layered Volumetric Organic Smoke Puffs (Photorealistic Billowing Fog)
    let seed = 7771;
    const pseudoRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Draw ~480 soft overlapping smoky puffs to create thick, organic clouds
    for (let p = 0; p < 480; p++) {
      const clusterAngle = pseudoRand() * Math.PI * 2;
      const distFactor = Math.pow(pseudoRand(), 0.7);
      const r = innerR + 15 + distFactor * (outerR - innerR - 25);
      const theta = clusterAngle + Math.sin(r * 0.04) * 0.45;
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;

      const puffR = 30 + pseudoRand() * 65; // Large soft smoke puffs
      const puffGrad = ctx.createRadialGradient(px, py, 0, px, py, puffR);

      const tonePick = pseudoRand();
      let colorCore: string;
      if (tonePick < 0.55) {
        colorCore = `rgba(15, 23, 42, ${0.16 + pseudoRand() * 0.16})`;
      } else if (tonePick < 0.85) {
        colorCore = `rgba(24, 24, 48, ${0.14 + pseudoRand() * 0.14})`;
      } else {
        colorCore = `rgba(51, 65, 85, ${0.12 + pseudoRand() * 0.12})`;
      }

      puffGrad.addColorStop(0, colorCore);
      puffGrad.addColorStop(0.5, colorCore.replace(/[\d\.]+\)$/, (m) => `${parseFloat(m) * 0.5})`));
      puffGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.fillStyle = puffGrad;
      ctx.beginPath();
      ctx.arc(px, py, puffR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Fine Smoky Wisps & Filamentous Strands
    for (let w = 0; w < 36; w++) {
      const startAngle = (w * Math.PI * 2) / 36 + (pseudoRand() - 0.5) * 0.3;
      ctx.strokeStyle = `rgba(15, 23, 42, ${0.25 + pseudoRand() * 0.3})`;
      ctx.lineWidth = 18 + pseudoRand() * 22;
      ctx.beginPath();
      for (let r = innerR + 10; r < outerR - 20; r += 8) {
        const spiralAngle = startAngle + (r - innerR) * 0.0035 + Math.sin(r * 0.03) * 0.15;
        const sx = cx + Math.cos(spiralAngle) * r;
        const sy = cy + Math.sin(spiralAngle) * r;
        if (r === innerR + 10) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // 4. Razor-Sharp Rounded Event Horizon Void Cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 5. Crisp, rounded photon lensing rim on event horizon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR + 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene with soft clean slate/white light background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // ToolSAP clean light background
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.022);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 11);

    // 3. Renderer with high-quality soft shading
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Soft Daylight Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // Warm soft sun key light from top-right
    const sunLight = new THREE.DirectionalLight(0xfffbf0, 1.8);
    sunLight.position.set(8, 12, 10);
    scene.add(sunLight);

    // Soft sky blue fill light from left
    const skyLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    skyLight.position.set(-8, 6, 6);
    scene.add(skyLight);

    // Book spine glow (soft subtle accent, never washes out open page text)
    const bookSpineLight = new THREE.PointLight(0x38bdf8, 0.5, 8, 1.4);
    bookSpineLight.position.set(0, 0.65, 0.15);
    scene.add(bookSpineLight);
    bookSpineLightRef.current = bookSpineLight;

    // ==========================================
    // 5. FIXED DENSE SMOKEY PORTAL (OPENS SMOOTHLY ON WOBBLE)
    // ==========================================
    const blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(0, 0.65, -4.2);
    // Initially hidden / collapsed until Wobble button is clicked!
    blackHoleGroup.scale.set(0.0001, 0.0001, 0.0001);
    blackHoleGroup.visible = false;
    scene.add(blackHoleGroup);
    blackHoleGroupRef.current = blackHoleGroup;

    // 5.1 Dense Gravitational Space Backdrop
    const backdropGeo = new THREE.PlaneGeometry(16, 16);
    const backdropMat = new THREE.MeshBasicMaterial({
      map: createDarkBackdropTexture(),
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, 0, -0.8);
    blackHoleGroup.add(backdropMesh);
    backdropMeshRef.current = backdropMesh;

    // 5.2 Compact Rounded Event Horizon Sphere (Deep Inky Void)
    const singularityGeo = new THREE.SphereGeometry(1.5, 48, 48);
    const singularityMat = new THREE.MeshBasicMaterial({
      color: 0x010204, // Deep inky absolute black void
    });
    const singularityMesh = new THREE.Mesh(singularityGeo, singularityMat);
    blackHoleGroup.add(singularityMesh);

    // 5.3 Luminous Einstein Photon Lensing Ring (Razor-sharp rounded boundary)
    const photonRingGeo = new THREE.RingGeometry(1.51, 1.63, 96);
    const photonRingMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const photonRingMesh = new THREE.Mesh(photonRingGeo, photonRingMat);
    blackHoleGroup.add(photonRingMesh);
    photonRingMeshRef.current = photonRingMesh;

    // 5.4 Primary Dense Smokey Portal Vortex Disk (Compact: Radius 1.52 to 5.6 units)
    const portalTexture = createDenseSmokeyPortalTexture();
    const portalGeo = new THREE.RingGeometry(1.52, 5.6, 96, 16);
    const portalMat = new THREE.MeshBasicMaterial({
      map: portalTexture,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const portalVortexMesh = new THREE.Mesh(portalGeo, portalMat);
    blackHoleGroup.add(portalVortexMesh);
    portalVortexMeshRef.current = portalVortexMesh;

    // 5.5 Secondary Layered Volumetric Smoke Disk (Dual churning vortex)
    const secondarySmokeGeo = new THREE.RingGeometry(1.52, 5.8, 96, 16);
    const secondarySmokeMat = new THREE.MeshBasicMaterial({
      map: portalTexture,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const secondarySmokeMesh = new THREE.Mesh(secondarySmokeGeo, secondarySmokeMat);
    secondarySmokeMesh.rotation.z = Math.PI / 4;
    secondarySmokeMesh.position.set(0, 0, 0.05);
    blackHoleGroup.add(secondarySmokeMesh);
    secondarySmokeMeshRef.current = secondarySmokeMesh;

    // 5.6 Crazy Relativistic Accretion Vortex Dust Particles (High-Energy Hypnotic Swirl)
    const vortexDustCount = 380;
    const vortexDustGeo = new THREE.BufferGeometry();
    const vortexPositions = new Float32Array(vortexDustCount * 3);
    const vortexColors = new Float32Array(vortexDustCount * 3);

    const vortexDustData: {
      radius: number;
      angle: number;
      orbitSpeedFactor: number;
      inflowSpeed: number;
      zOffset: number;
      radialWobbleSpeed: number;
      radialWobblePhase: number;
    }[] = [];

    const vortexPalette = [
      new THREE.Color(0xffffff), // Pure white-hot relativistic photons
      new THREE.Color(0x38bdf8), // Electric cyan
      new THREE.Color(0x0ea5e9), // Deep sky blue
      new THREE.Color(0x818cf8), // Cosmic violet
      new THREE.Color(0xfbbf24), // Radiant golden accretion spark
      new THREE.Color(0xf59e0b), // Deep amber ember
      new THREE.Color(0x2dd4bf), // Bright neon turquoise
    ];

    for (let i = 0; i < vortexDustCount; i++) {
      const rRatio = Math.pow(Math.random(), 0.75);
      const r = 1.54 + rRatio * (5.7 - 1.54);
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 0.45;

      vortexPositions[i * 3] = Math.cos(angle) * r;
      vortexPositions[i * 3 + 1] = Math.sin(angle) * r;
      vortexPositions[i * 3 + 2] = z;

      const col = vortexPalette[Math.floor(Math.random() * vortexPalette.length)];
      vortexColors[i * 3] = col.r;
      vortexColors[i * 3 + 1] = col.g;
      vortexColors[i * 3 + 2] = col.b;

      vortexDustData.push({
        radius: r,
        angle: angle,
        orbitSpeedFactor: 0.9 + Math.random() * 0.45,
        inflowSpeed: 0.45 + Math.random() * 0.65,
        zOffset: z,
        radialWobbleSpeed: 2.5 + Math.random() * 3.5,
        radialWobblePhase: Math.random() * Math.PI * 2,
      });
    }

    vortexDustGeo.setAttribute('position', new THREE.BufferAttribute(vortexPositions, 3));
    vortexDustGeo.setAttribute('color', new THREE.BufferAttribute(vortexColors, 3));
    vortexDustGeoRef.current = vortexDustGeo;
    vortexDustDataRef.current = vortexDustData;

    // Glowing particle texture
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dotCtx = dotCanvas.getContext('2d')!;
    const dotGrad = dotCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    dotGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    dotGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
    dotGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.75)');
    dotGrad.addColorStop(0.82, 'rgba(14, 165, 233, 0.25)');
    dotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dotCtx.fillStyle = dotGrad;
    dotCtx.fillRect(0, 0, 64, 64);
    const dotTexture = new THREE.CanvasTexture(dotCanvas);

    const vortexDustMat = new THREE.PointsMaterial({
      size: 0.22,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const vortexDustPoints = new THREE.Points(vortexDustGeo, vortexDustMat);
    vortexDustPoints.position.set(0, 0, 0.08);
    blackHoleGroup.add(vortexDustPoints);

    // 5.7 Deep Cosmic Singularity Backlight (Fades in with portal)
    const singularityLight = new THREE.PointLight(0x38bdf8, 0, 20, 1.6);
    singularityLight.position.set(0, 0.65, -3.2);
    scene.add(singularityLight);
    singularityLightRef.current = singularityLight;

    // ==========================================
    // 6. SOFT CONTACT SHADOW ON GROUND
    // ==========================================
    const shadowGeo = new THREE.PlaneGeometry(7.5, 4.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -2.8, 0);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // ==========================================
    // 7. PHOTOREALISTIC FLOATING 3D BOOK (SCALED UP & HERO-SIZED)
    // ==========================================
    const BOOK_SCALE = 1.28;
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 0.65, 0);
    bookGroup.scale.set(BOOK_SCALE, BOOK_SCALE, BOOK_SCALE);
    scene.add(bookGroup);
    bookGroupRef.current = bookGroup;

    // High-Resolution Procedural Textures
    const coverTexLeft = createRealisticBookCoverTexture(true);
    const coverTexRight = createRealisticBookCoverTexture(false);
    const pageSpreadLeft = createRealisticOpenPageTexture('left');
    const pageSpreadRight = createRealisticOpenPageTexture('right');
    const pageEdgesSide = createRealisticPageEdgesTexture(false);
    const pageEdgesTop = createRealisticPageEdgesTexture(true);
    const spineTex = createRealisticSpineTexture();
    const headbandTex = createRealisticHeadbandTexture();

    const bW = 2.15;
    const bH = 3.05;
    const bD = 0.055;
    const openAngle = 0.44; // ~25.2 degrees open

    const pW = 2.05;
    const pH = 2.92;
    const pD = 0.32;
    const zMid = pD + bD; // 0.375: exact half-thickness of the solid book

    // Leather Cover Materials
    const coverLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x172554,
      roughness: 0.42,
      metalness: 0.12,
    });
    const coverEndsheetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
    });
    const leftFrontCoverMat = new THREE.MeshStandardMaterial({
      map: coverTexLeft,
      roughness: 0.38,
      metalness: 0.18,
    });
    const rightBackCoverMat = new THREE.MeshStandardMaterial({
      map: coverTexRight,
      roughness: 0.38,
      metalness: 0.18,
    });

    // Left Cover (+X, -X, +Y, -Y, +Z (interior), -Z (exterior front with gold 404 stamping))
    const leftCoverGeo = new THREE.BoxGeometry(bW, bH, bD);
    leftCoverGeo.translate(-bW / 2, 0, 0);
    const leftCover = new THREE.Mesh(leftCoverGeo, [
      coverLeatherMat,
      coverLeatherMat,
      coverLeatherMat,
      coverLeatherMat,
      coverEndsheetMat,
      leftFrontCoverMat,
    ]);
    // Open initially: front cover open to left at openAngle
    leftCover.position.set(-0.02, 0, 0);
    leftCover.rotation.y = openAngle;
    leftCoverRef.current = leftCover;

    // Right Cover (+X, -X, +Y, -Y, +Z (interior), -Z (exterior back with barcode seal))
    const rightCoverGeo = new THREE.BoxGeometry(bW, bH, bD);
    rightCoverGeo.translate(bW / 2, 0, 0);
    const rightCover = new THREE.Mesh(rightCoverGeo, [
      coverLeatherMat,
      coverLeatherMat,
      coverLeatherMat,
      coverLeatherMat,
      coverEndsheetMat,
      rightBackCoverMat,
    ]);
    // Open initially: back cover open to right at -openAngle
    rightCover.position.set(0.02, 0, 0);
    rightCover.rotation.y = -openAngle;
    rightCoverRef.current = rightCover;

    // 4 Polished Brass Corner Protectors with Rivets
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.88,
    });

    const createBrassCorner = (isLeft: boolean, isTop: boolean) => {
      const cGroup = new THREE.Group();
      const bracketGeo = new THREE.BoxGeometry(0.24, 0.24, bD + 0.02);
      const bracketMesh = new THREE.Mesh(bracketGeo, brassMat);
      cGroup.add(bracketMesh);

      const rivetGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const rivet = new THREE.Mesh(rivetGeo, brassMat);
      rivet.position.set(0, 0, (bD + 0.02) / 2);
      cGroup.add(rivet);

      const posX = isLeft ? -bW + 0.12 : bW - 0.12;
      const posY = isTop ? bH / 2 - 0.12 : -bH / 2 + 0.12;
      cGroup.position.set(posX, posY, 0);
      return cGroup;
    };

    leftCover.add(createBrassCorner(true, true));
    leftCover.add(createBrassCorner(true, false));
    rightCover.add(createBrassCorner(false, true));
    rightCover.add(createBrassCorner(false, false));

    // Page Block Materials
    const leftPageFaceMat = new THREE.MeshStandardMaterial({
      map: pageSpreadLeft,
      roughness: 0.88,
    });
    const rightPageFaceMat = new THREE.MeshStandardMaterial({
      map: pageSpreadRight,
      roughness: 0.88,
    });
    const pageEdgesSideMat = new THREE.MeshStandardMaterial({
      map: pageEdgesSide,
      roughness: 0.82,
    });
    const pageEdgesTopMat = new THREE.MeshStandardMaterial({
      map: pageEdgesTop,
      roughness: 0.6,
      metalness: 0.25,
    });
    const creaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
    });
    const paperBaseMat = new THREE.MeshStandardMaterial({
      color: 0xfaf6ec,
      roughness: 0.88,
    });

    // Left Page Stack (+X: crease, -X: fore-edge, +Y: top edge, -Y: bottom edge, +Z: open page face, -Z: bottom)
    const leftStackGeo = new THREE.BoxGeometry(pW, pH, pD);
    leftStackGeo.translate(-pW / 2, 0, pD / 2);
    const leftStack = new THREE.Mesh(leftStackGeo, [
      creaseMat,
      pageEdgesSideMat,
      pageEdgesTopMat,
      pageEdgesSideMat,
      leftPageFaceMat,
      paperBaseMat,
    ]);
    // Open initially: left stack resting at openAngle
    leftStack.position.set(-0.02, 0, bD / 2);
    leftStack.rotation.y = openAngle;
    leftStackRef.current = leftStack;

    // Right Page Stack (+X: fore-edge, -X: crease, +Y: top edge, -Y: bottom edge, +Z: open page face, -Z: bottom)
    const rightStackGeo = new THREE.BoxGeometry(pW, pH, pD);
    rightStackGeo.translate(pW / 2, 0, pD / 2);
    const rightStack = new THREE.Mesh(rightStackGeo, [
      pageEdgesSideMat,
      creaseMat,
      pageEdgesTopMat,
      pageEdgesSideMat,
      rightPageFaceMat,
      paperBaseMat,
    ]);
    // Open initially: right stack resting at -openAngle
    rightStack.position.set(0.02, 0, bD / 2);
    rightStack.rotation.y = -openAngle;
    rightStackRef.current = rightStack;

    // Spine with Curved Backing & 4 Raised Cord Ribs (Seamlessly wraps the 0.75 book depth!)
    const spineRadius = zMid;
    const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, bH, 24, 1, false, Math.PI * 0.5, Math.PI);
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.42,
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, -0.05);
    spine.scale.set(0.58, 1.0, 0.58);
    spineRef.current = spine;

    const ribMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.28,
      metalness: 0.85,
    });
    const ribYs = [-0.9, -0.3, 0.3, 0.9];
    ribYs.forEach((ry) => {
      const ribGeo = new THREE.TorusGeometry(spineRadius + 0.008, 0.022, 12, 24, Math.PI);
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(0, ry, 0);
      rib.rotation.y = Math.PI / 2;
      spine.add(rib); // Attached directly to spine mesh so ribs never detach or float away!
    });

    // Woven Headband & Tailband Cords
    const headbandGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.34, 16);
    const headbandMat = new THREE.MeshStandardMaterial({
      map: headbandTex,
      roughness: 0.65,
    });

    const topHeadband = new THREE.Mesh(headbandGeo, headbandMat);
    topHeadband.rotation.z = Math.PI / 2;
    topHeadband.position.set(0, pH / 2 + 0.02, 0);
    topHeadbandRef.current = topHeadband;

    const bottomTailband = new THREE.Mesh(headbandGeo, headbandMat);
    bottomTailband.rotation.z = Math.PI / 2;
    bottomTailband.position.set(0, -pH / 2 - 0.02, 0);
    bottomTailbandRef.current = bottomTailband;

    // Realistic Woven Golden Silk Ribbon Bookmark
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, pH / 2 + 0.02, 0.14),
      new THREE.Vector3(0.08, pH / 2 - 0.35, 0.35),
      new THREE.Vector3(0.24, 0.2, 0.38),
      new THREE.Vector3(0.2, -pH / 2, 0.36),
      new THREE.Vector3(0.16, -bH / 2 - 0.15, 0.28),
      new THREE.Vector3(0.18, -bH / 2 - 0.28, 0.22),
    ]);
    const ribbonPoints = ribbonCurve.getPoints(24);
    const ribbonWidth = 0.14;
    const ribbonPositions: number[] = [];
    const ribbonNormals: number[] = [];
    const ribbonUVs: number[] = [];

    for (let i = 0; i < ribbonPoints.length; i++) {
      const pt = ribbonPoints[i];
      const t = i / (ribbonPoints.length - 1);
      const w = ribbonWidth * (i === ribbonPoints.length - 1 ? 0.01 : 1.0);
      ribbonPositions.push(pt.x - w / 2, pt.y, pt.z);
      ribbonPositions.push(pt.x + w / 2, pt.y, pt.z);
      ribbonNormals.push(0, 0, 1);
      ribbonNormals.push(0, 0, 1);
      ribbonUVs.push(0, t);
      ribbonUVs.push(1, t);
    }
    const ribbonIndices: number[] = [];
    for (let i = 0; i < ribbonPoints.length - 1; i++) {
      const i0 = i * 2;
      const i1 = i * 2 + 1;
      const i2 = (i + 1) * 2;
      const i3 = (i + 1) * 2 + 1;
      ribbonIndices.push(i0, i1, i2);
      ribbonIndices.push(i1, i3, i2);
    }
    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPositions, 3));
    ribbonGeo.setAttribute('normal', new THREE.Float32BufferAttribute(ribbonNormals, 3));
    ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ribbonUVs, 2));
    ribbonGeo.setIndex(ribbonIndices);
    ribbonGeo.computeVertexNormals();

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.28,
      metalness: 0.65,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);

    // Book Inner Group for Smooth Kinematics (Centered when open)
    const bookInnerGroup = new THREE.Group();
    bookInnerGroup.position.set(0, 0, 0);
    bookGroup.add(bookInnerGroup);
    bookInnerGroupRef.current = bookInnerGroup;

    bookInnerGroup.add(leftCover);
    bookInnerGroup.add(rightCover);
    bookInnerGroup.add(leftStack);
    bookInnerGroup.add(rightStack);
    bookInnerGroup.add(spine);
    bookInnerGroup.add(topHeadband);
    bookInnerGroup.add(bottomTailband);
    bookInnerGroup.add(ribbon);

    // Celestial Tome Aura Point Light (Radiates outward from within book as it opens)
    const bookAuraLight = new THREE.PointLight(0xfbbf24, 0, 10, 1.4);
    bookAuraLight.position.set(0, 0, 0.4);
    bookInnerGroup.add(bookAuraLight);
    bookAuraLightRef.current = bookAuraLight;

    // Golden Archival Sparks / Shimmer Dust around the opening seam
    const sparkleCount = 30;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(sparkleCount * 3);
    for (let s = 0; s < sparkleCount; s++) {
      sparklePos[s * 3] = (Math.random() - 0.5) * 2.8;
      sparklePos[s * 3 + 1] = (Math.random() - 0.5) * 3.4;
      sparklePos[s * 3 + 2] = (Math.random() - 0.5) * 0.8 + 0.3;
    }
    sparkleGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparklePos, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xfde68a,
      size: 0.09,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bookHoverSparkles = new THREE.Points(sparkleGeo, sparkleMat);
    bookInnerGroup.add(bookHoverSparkles);
    bookHoverSparklesRef.current = bookHoverSparkles;

    // Interactive Page Flip Radiant Trail Sparkles
    const flipSparkleCount = 48;
    const flipSparkleGeo = new THREE.BufferGeometry();
    const flipSparklePositions = new Float32Array(flipSparkleCount * 3);
    const flipSparkleVelocities = new Float32Array(flipSparkleCount * 3);
    flipSparkleGeo.setAttribute('position', new THREE.BufferAttribute(flipSparklePositions, 3));
    const flipSparkleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flipSparklesMesh = new THREE.Points(flipSparkleGeo, flipSparkleMat);
    bookInnerGroup.add(flipSparklesMesh);
    flipSparklesRef.current = {
      points: flipSparklesMesh,
      geo: flipSparkleGeo,
      posAttr: flipSparkleGeo.attributes.position as THREE.BufferAttribute,
      velocities: flipSparkleVelocities,
      life: 0,
      maxLife: 0.65,
    };

    // 6 Double-Sided Flippable Pages: Every single page boldly stamped with 'PAGE NOT FOUND'
    const TOTAL_FLIPPABLE_PAGES = 6;
    const flippablePages: FlippablePageItem[] = [];
    const flippableSheetW = pW * 0.96;
    const flippableSheetH = pH * 0.96;

    for (let i = 0; i < TOTAL_FLIPPABLE_PAGES; i++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0, 0, pD + bD / 2 + (TOTAL_FLIPPABLE_PAGES - 1 - i) * 0.003);
      pageGroup.rotation.y = 0; // Flat inside closed book initially
      pageGroup.visible = false;

      // Front face (+Z local normal, visible when resting on right stack)
      // Displays 'PAGE NOT FOUND'
      const frontGeo = new THREE.PlaneGeometry(flippableSheetW, flippableSheetH, 24, 16);
      frontGeo.translate(flippableSheetW / 2, 0, 0); // Pivot hinge at spine X=0
      const frontMat = new THREE.MeshStandardMaterial({
        map: pageSpreadRight,
        roughness: 0.86,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const frontMesh = new THREE.Mesh(frontGeo, frontMat);
      frontMesh.position.set(0, 0, 0.001);
      frontMesh.userData = { isFlippablePage: true, pageIndex: i, isRightSide: true };
      pageGroup.add(frontMesh);

      // Back face (-Z local normal, visible when flipped to left stack)
      // Displays 'PAGE NOT FOUND' with perfect upright orientation and spine gutter
      const backGeo = new THREE.PlaneGeometry(flippableSheetW, flippableSheetH, 24, 16);
      backGeo.translate(-flippableSheetW / 2, 0, 0); // Sits at same physical location when rotated by PI
      const backMat = new THREE.MeshStandardMaterial({
        map: pageSpreadLeft,
        roughness: 0.86,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const backMesh = new THREE.Mesh(backGeo, backMat);
      backMesh.rotation.y = Math.PI; // Inverts normal to -Z, spine crease stays at X=0
      backMesh.position.set(0, 0, -0.001);
      backMesh.userData = { isFlippablePage: true, pageIndex: i, isLeftSide: true };
      pageGroup.add(backMesh);

      bookInnerGroup.add(pageGroup);

      flippablePages.push({
        group: pageGroup,
        frontMesh,
        backMesh,
        frontGeo,
        backGeo,
        progress: i < 3 ? 1.0 : 0.0, // Balanced initial spread: 3 on left stack, 3 on right stack
        targetProgress: i < 3 ? 1.0 : 0.0,
        flipSpeed: 1.85,
        isFlipping: false,
        landingTimer: 0,
        pageIndex: i,
      });
    }
    flippablePagesRef.current = flippablePages;

    const triggerFlipSparkles = (_pageIdx: number, targetProgress: number) => {
      if (!flipSparklesRef.current) return;
      const fs = flipSparklesRef.current;
      fs.life = fs.maxLife;
      const count = fs.velocities.length / 3;
      const startX = targetProgress > 0.5 ? flippableSheetW * 0.9 : -flippableSheetW * 0.9;
      for (let s = 0; s < count; s++) {
        fs.posAttr.setXYZ(
          s,
          startX + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * flippableSheetH * 0.85,
          pD + 0.15 + (Math.random() - 0.5) * 0.2
        );
        fs.velocities[s * 3] = (Math.random() - 0.5) * 1.6;
        fs.velocities[s * 3 + 1] = (Math.random() - 0.2) * 1.8;
        fs.velocities[s * 3 + 2] = 0.6 + Math.random() * 1.2;
      }
      fs.posAttr.needsUpdate = true;
      (fs.points.material as THREE.PointsMaterial).opacity = 0.95;
    };

    // =======================================================
    // 8. LUMINOUS ANIME SCATTERED CODEX SHEETS (DYNAMIC CIRCULAR AIRFLOW ORBITS)
    // =======================================================
    const pagesGroup = new THREE.Group();
    scene.add(pagesGroup);

    const TOTAL_FLOATING_PAGES = 10;
    const pageItems: typeof pageItemsRef.current = [];

    // Distinct luminous emissive anime glows matching the 10 themes (Green, Blue, Purple, Red, Yellow)
    const ANIME_GLOW_COLORS = [
      0x34d399, // 0: Emerald Wind (Green)
      0x38bdf8, // 1: Azure Celestial (Blue)
      0xc084fc, // 2: Violet Arcana (Purple)
      0xfb7185, // 3: Crimson Flame (Red)
      0xfacc15, // 4: Solar Alchemy (Yellow)
      0x4ade80, // 5: Mint Jade (Green)
      0x60a5fa, // 6: Electric Cyan (Blue)
      0xd8b4fe, // 7: Astral Lavender (Purple)
      0xf472b6, // 8: Sakura Blossom (Red/Pink)
      0xfbbf24, // 9: Topaz Solar (Yellow/Amber)
    ];

    for (let i = 0; i < TOTAL_FLOATING_PAGES; i++) {
      const isArtifact = i < LOST_ARTIFACTS.length;
      const artifact = isArtifact ? LOST_ARTIFACTS[i] : undefined;

      // 1. Aerodynamic Dimensions & Subdivided Plane for Organic Curves
      const sheetW = 1.28;
      const sheetH = 1.70;
      const sheetGeo = new THREE.PlaneGeometry(sheetW, sheetH, 24, 24);

      // 2. Distinct 3D Curvy Paper Profiles (4 organic aerodynamic archetypes - never straight/flat!)
      const posAttr = sheetGeo.attributes.position;
      const baseCurvature = new Float32Array(posAttr.count);
      const curveArchetype = i % 4;

      for (let j = 0; j < posAttr.count; j++) {
        const vx = posAttr.getX(j);
        const vy = posAttr.getY(j);
        const normX = vx / (sheetW * 0.5); // normalized [-1, 1]
        const normY = vy / (sheetH * 0.5); // normalized [-1, 1]

        let zVal = 0;
        if (curveArchetype === 0) {
          // Archetype 0: Flowing S-Curve / Wavy Anime Ribbon (Airflow ripple)
          zVal = Math.sin(normX * Math.PI * 0.9) * 0.32 + Math.cos(normY * Math.PI * 0.7) * 0.16;
          if (normX > 0.4 && normY > 0.4) {
            zVal += Math.pow((normX - 0.4) * (normY - 0.4), 1.5) * 0.35; // Dog-ear fold
          }
        } else if (curveArchetype === 1) {
          // Archetype 1: Deep Parabolic Wind Scoop / Aerodynamic Airfoil
          zVal = (1.0 - normX * normX) * 0.38 - Math.sin(normY * Math.PI * 0.6) * 0.18;
        } else if (curveArchetype === 2) {
          // Archetype 2: Dynamic Aerodynamic Winglet Twist (Corners twisted in airflow)
          zVal = (normX * normY) * 0.42 + Math.sin(normX * Math.PI * 0.8) * 0.14;
        } else {
          // Archetype 3: Rolled Scroll Arch (Parchment roll at top, flared trailing corner)
          zVal = Math.cos(normY * Math.PI) * 0.30 + Math.sin(normX * 1.8) * 0.18;
          if (normX > 0.45 && normY < -0.45) {
            zVal -= Math.pow((normX - 0.45) * (-normY - 0.45), 1.4) * 0.32;
          }
        }

        posAttr.setZ(j, zVal);
        baseCurvature[j] = zVal;
      }
      sheetGeo.computeVertexNormals();

      // 3. Anime Satin Material with Inner Luminous Glow
      const glowHex = ANIME_GLOW_COLORS[i % ANIME_GLOW_COLORS.length];
      const sheetMat = new THREE.MeshStandardMaterial({
        map: createAnimePageTexture(i),
        side: THREE.DoubleSide,
        roughness: 0.38,
        metalness: 0.08,
        emissive: new THREE.Color(glowHex).multiplyScalar(0.09),
      });

      const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);

      // 4. Orbital Kinematics on Inclined Circular Airflow Planes
      const baseAngle = (i / TOTAL_FLOATING_PAGES) * Math.PI * 2 + (i % 3) * 0.12;
      const baseRadius = 4.8 + (i % 3) * 1.1 + (i % 2) * 0.4;
      const orbitSpeed = 0.14 + (i % 4) * 0.025;
      const tiltX = (i % 2 === 0 ? 1 : -1) * (0.16 + (i % 3) * 0.08);
      const tiltZ = (i % 3 === 1 ? 1 : -1) * (0.14 + (i % 4) * 0.06);

      const initX = Math.cos(baseAngle) * baseRadius;
      const initY = 0.65 + Math.sin(baseAngle) * baseRadius * Math.cos(tiltX);
      const initZ = Math.sin(baseAngle) * baseRadius * Math.sin(tiltZ);

      sheetMesh.position.set(initX, initY, initZ);
      sheetMesh.userData = {
        isPage: true,
        pageIndex: i,
        isArtifact,
        artifact,
      };

      pagesGroup.add(sheetMesh);

      pageItems.push({
        id: i,
        mesh: sheetMesh,
        baseRadius,
        orbitAngle: baseAngle,
        orbitSpeed,
        tiltX,
        tiltZ,
        phaseR: i * 1.45,
        phaseY: i * 2.15,
        phaseZ: i * 0.85,
        currentPos: new THREE.Vector3(initX, initY, initZ),
        repulsionOffset: new THREE.Vector3(0, 0, 0),
        flutterPhase: i * 1.25,
        flutterSpeed: 1.1 + (i % 3) * 0.3,
        isArtifact,
        artifact,
        baseCurvature,
        state: 'orbiting',
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        dragOffset: new THREE.Vector3(0, 0, 0),
        grabWorldPos: new THREE.Vector3(initX, initY, initZ),
        throwTimer: 0,
        respawnDelay: 0,
        targetScale: 1.0,
        currentScale: 1.0,
        baseGlowHex: glowHex,
      });
    }
    pageItemsRef.current = pageItems;

    // ==========================================
    // 9. QUANTUM DUST FLOATING IN 3D AIR
    // ==========================================
    const partCount = 130;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(partCount * 3);
    const colors = new Float32Array(partCount * 3);

    const quantumColors = [
      new THREE.Color(0x38bdf8), // electric cyan
      new THREE.Color(0xfbbf24), // radiant amber
      new THREE.Color(0xa855f7), // cosmic violet
      new THREE.Color(0x34d399), // emerald sparkle
      new THREE.Color(0xf472b6), // pastel rose
      new THREE.Color(0xffffff), // stellar white
    ];

    const quantumDustData: {
      baseX: number;
      baseY: number;
      baseZ: number;
      driftSpeedX: number;
      driftSpeedY: number;
      driftSpeedZ: number;
      phase: number;
    }[] = [];

    for (let p = 0; p < partCount; p++) {
      // Floating throughout the 3D space in air around book and scattered folios
      const x = (Math.random() - 0.5) * 14.5;
      const y = (Math.random() - 0.5) * 8.5;
      const z = -2.5 + Math.random() * 5.2;

      positions[p * 3] = x;
      positions[p * 3 + 1] = y;
      positions[p * 3 + 2] = z;

      const pick = quantumColors[p % quantumColors.length];
      colors[p * 3] = pick.r;
      colors[p * 3 + 1] = pick.g;
      colors[p * 3 + 2] = pick.b;

      quantumDustData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        driftSpeedX: 0.35 + Math.random() * 0.45,
        driftSpeedY: 0.45 + Math.random() * 0.55,
        driftSpeedZ: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      });
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const partMat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // ==========================================
    // 10. SMOOTH ANIMATION LOOP (PORTAL OPENS ON WOBBLE, HERO BOOK)
    // ==========================================
    let clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth pointer interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const px = mouseRef.current.x;
      const py = mouseRef.current.y;

      if (!reducedMotionRef.current) {
        camera.position.x = px * 1.2;
        camera.position.y = 0.6 + py * 0.8;
        camera.lookAt(0, 0.2, 0);
      }

      // 1. Black hole opens smoothly AFTER clicking Wobble!
      if (isChaosModeRef.current) {
        portalOpenRef.current = true;
      }

      if (portalOpenRef.current && !isPortalClosedRef.current) {
        // Smooth opening progress over ~1.3 seconds
        if (portalAppearProgressRef.current < 1.0) {
          portalAppearProgressRef.current = Math.min(1.0, portalAppearProgressRef.current + delta * 0.75);
        }
      }

      const pProgress = portalAppearProgressRef.current;
      const easePortal = 1 - Math.pow(1 - pProgress, 3);

      // VFX Portal Collapse & Dissipation once book is completely swallowed!
      let collapseFactor = 1.0;
      if (isBookConsumedRef.current && !isPortalClosedRef.current) {
        // Step A: 0.45s post-consumption shockwave flash as the singularity digests matter
        if (!(window as unknown as { __freezeChaos?: boolean }).__freezeChaos) {
          postConsumptionTimerRef.current += delta;
        }
        if (postConsumptionTimerRef.current >= 0.45) {
          // Step B: VFX portal collapse progress over ~1.5s
          if (!(window as unknown as { __freezeChaos?: boolean }).__freezeChaos) {
            portalCloseProgressRef.current = Math.min(1.0, portalCloseProgressRef.current + delta * 0.68);
          }
          const closeT = portalCloseProgressRef.current;
          collapseFactor = Math.pow(1 - closeT, 2.5); // Smooth cinematic power decay

          if (portalCloseProgressRef.current >= 0.999) {
            isPortalClosedRef.current = true;
          }
        }
      }

      const finalPortalScale = easePortal * collapseFactor;
      portalScaleRef.current = finalPortalScale;

      if (blackHoleGroupRef.current) {
        if (finalPortalScale < 0.0005 || isPortalClosedRef.current) {
          blackHoleGroupRef.current.visible = false;
        } else {
          blackHoleGroupRef.current.visible = true;
          // Pulse during digestion or breathing when open
          let pulseBonus = 0;
          if (isBookConsumedRef.current && postConsumptionTimerRef.current < 0.45) {
            const pulseT = postConsumptionTimerRef.current / 0.45;
            pulseBonus = Math.sin(pulseT * Math.PI) * 0.08;
          } else if (portalCloseProgressRef.current === 0) {
            pulseBonus = Math.sin(elapsed * 2.5) * 0.012;
          }
          const dynamicScale = finalPortalScale * (1.0 + pulseBonus);
          blackHoleGroupRef.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
        }
      }

      if (singularityLightRef.current) {
        let lightBoost = 0;
        if (isBookConsumedRef.current && postConsumptionTimerRef.current < 0.45) {
          const pulseT = postConsumptionTimerRef.current / 0.45;
          lightBoost = Math.sin(pulseT * Math.PI) * 4.5; // High-energy photon flash!
        }
        singularityLightRef.current.intensity = (3.6 * finalPortalScale) + lightBoost;
      }

      // 1.1 Constant Spinning of Black Hole Portal & Dual Smoke Layers
      if (portalScaleRef.current > 0.0005 && !isPortalClosedRef.current) {
        // Spin accelerates dynamically during collapse (conservation of angular momentum)
        const collapseSpinBoost = portalCloseProgressRef.current * 4.5;

        if (portalVortexMeshRef.current) {
          portalVortexMeshRef.current.rotation.z += delta * (1.6 + collapseSpinBoost);
          const mat = portalVortexMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.96 * collapseFactor;
        }
        if (secondarySmokeMeshRef.current) {
          secondarySmokeMeshRef.current.rotation.z -= delta * (1.25 + collapseSpinBoost * 0.8);
          const mat = secondarySmokeMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.65 * collapseFactor;
        }
        if (photonRingMeshRef.current) {
          photonRingMeshRef.current.rotation.z += delta * (0.5 + collapseSpinBoost * 0.5);
          const pRingMat = photonRingMeshRef.current.material as THREE.MeshBasicMaterial;
          pRingMat.opacity = (0.82 + Math.sin(elapsed * 6.0) * 0.15) * collapseFactor;
        }
        if (backdropMeshRef.current) {
          const mat = backdropMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.94 * collapseFactor;
        }

        // 1.2 Crazy Spinning Dust Particles Swirling into Black Hole
        if (vortexDustGeoRef.current && vortexDustDataRef.current.length > 0) {
          const vPosAttr = vortexDustGeoRef.current.attributes.position as THREE.BufferAttribute;
          const vData = vortexDustDataRef.current;
          const count = vData.length;
          const isCollapsing = portalCloseProgressRef.current > 0;

          for (let i = 0; i < count; i++) {
            const mote = vData[i];

            if (isCollapsing) {
              // During collapse: particles violently spiral inward into the singularity point (r -> 0)
              mote.radius = Math.max(0.01, mote.radius * (1 - delta * 4.5));
              mote.angle += delta * (16.0 + (5.8 - mote.radius) * 8.0);
            } else {
              // Normal state: Relativistic Keplerian angular velocity (whips crazily faster near event horizon)
              const r = mote.radius;
              const invDist = Math.max(0.15, r - 1.35);
              const crazyAngularSpeed = (3.2 + 3.8 / Math.pow(invDist, 0.85)) * mote.orbitSpeedFactor;
              mote.angle += delta * crazyAngularSpeed;

              // Gravitational inward suction (spirals towards event horizon)
              const inwardSpeed = (0.55 + 1.8 / Math.pow(invDist, 0.7)) * mote.inflowSpeed;
              mote.radius -= delta * inwardSpeed;

              // Relativistic crossing: when particle plunges past event horizon (r <= 1.51)
              // It is consumed and respawns at outer accretion boundary (5.3 - 5.9)
              if (mote.radius <= 1.51) {
                mote.radius = 5.3 + Math.random() * 0.65;
                mote.angle = Math.random() * Math.PI * 2;
              }
            }

            // Volumetric ripple turbulence
            const effR = mote.radius + Math.sin(elapsed * mote.radialWobbleSpeed + mote.radialWobblePhase) * 0.06;
            const px = Math.cos(mote.angle) * effR;
            const py = Math.sin(mote.angle) * effR;
            const pz = mote.zOffset + Math.sin(mote.angle * 2.5 + elapsed * 4) * 0.08;

            vPosAttr.setXYZ(i, px, py, pz);
          }
          vPosAttr.needsUpdate = true;
        }
      }

      // 2. Slow, graceful VFX suction of the book into the black hole (never returns!)
      if (portalAppearProgressRef.current >= 0.95 && !isBookConsumedRef.current && !(window as any).__freezeChaos) {
        bookSuckProgressRef.current = Math.min(1.0, bookSuckProgressRef.current + delta * 0.19);
        if (bookSuckProgressRef.current >= 0.999) {
          isBookConsumedRef.current = true;
        }
      }

      // 3. Quantum Dust motes floating in 3D air
      const posAttr = partGeo.attributes.position as THREE.BufferAttribute;
      for (let p = 0; p < partCount; p++) {
        const qData = quantumDustData[p];
        const driftX = Math.sin(elapsed * qData.driftSpeedX + qData.phase) * 0.35;
        const driftY = Math.cos(elapsed * qData.driftSpeedY + qData.phase) * 0.3;
        const driftZ = Math.sin(elapsed * qData.driftSpeedZ + qData.phase) * 0.25;

        // Subtle pointer breeze on nearby air particles
        const curX = qData.baseX + driftX;
        const curY = qData.baseY + driftY;
        const dx = curX - px * 5;
        const dy = curY - py * 3;
        const dist = Math.hypot(dx, dy);
        let pushX = 0;
        let pushY = 0;
        if (dist < 2.0) {
          const force = (2.0 - dist) * 0.2;
          pushX = dx * force;
          pushY = dy * force;
        }

        posAttr.setXYZ(p, curX + pushX, curY + pushY, qData.baseZ + driftZ);
      }
      posAttr.needsUpdate = true;

      // 4. Book Levitation & Suction into Black Hole (Hero VFX Sequence)
      if (bookGroupRef.current) {
        if (isBookConsumedRef.current) {
          // Permanently sucked in — NEVER RETURN!
          bookGroupRef.current.visible = false;
          if (shadowMeshRef.current) shadowMeshRef.current.visible = false;
          if (bookSpineLightRef.current) bookSpineLightRef.current.intensity = 0;
        } else if (bookSuckProgressRef.current > 0) {
          // Photorealistic, physically graceful gravitational orbital infall into the singularity
          const suckT = bookSuckProgressRef.current;
          
          // 1. Z-Depth: Smooth relativistic acceleration towards the singularity event horizon at Z = -4.2
          const accelZ = Math.pow(suckT, 1.6);
          const posZ = THREE.MathUtils.lerp(0, -4.2, accelZ);

          // 2. Relativistic Keplerian Orbital Inward Spiral (Graceful ellipse around the vortex)
          // Starts at (0, 0.65), performs 2.0 graceful revolutions, and converges smoothly into the event horizon center
          const spiralRev = 2.0;
          const spiralAngle = Math.pow(suckT, 1.25) * (Math.PI * 2 * spiralRev);
          const orbitRadius = Math.sin(suckT * Math.PI) * (1 - suckT) * 0.22;

          const posX = Math.sin(spiralAngle) * orbitRadius;
          const posY = 0.65 + Math.cos(spiralAngle) * orbitRadius * 0.35;

          bookGroupRef.current.position.set(posX, posY, posZ);

          // 3. Smooth Physical Orientation (Aerodynamic banking into the gravitational vortex - zero jitter, zero shake!)
          const pitchAngle = THREE.MathUtils.lerp(0, -0.65, Math.pow(suckT, 0.85));
          const yawAngle = spiralAngle * 0.45 + THREE.MathUtils.lerp(0, Math.PI * 1.5, Math.pow(suckT, 1.2));
          const rollBank = Math.sin(spiralAngle) * (1 - suckT) * 0.24;

          bookGroupRef.current.rotation.set(pitchAngle, yawAngle, rollBank);

          // 4. Uniform, Photorealistic Geometric Scaling (Zero distortion! Pure physical integrity)
          const scaleDecay = Math.pow(1 - suckT, 1.5);
          const uniformScale = 1.28 * Math.max(0.0001, scaleDecay);
          bookGroupRef.current.scale.set(uniformScale, uniformScale, uniformScale);

          // 5. Relativistic Singularity Backlight & Spine Aura
          if (bookSpineLightRef.current) {
            bookSpineLightRef.current.position.set(posX, posY, posZ + 0.25);
            const flare = Math.sin(suckT * Math.PI);
            bookSpineLightRef.current.intensity = (2.2 * (1 - suckT)) + flare * 3.5;
            bookSpineLightRef.current.distance = 10 * (1 - suckT * 0.6);
          }

          // 6. Contact shadow smoothly shrinks and fades out with height and infall
          if (shadowMeshRef.current) {
            const shadowScale = (1 - suckT) * 1.28;
            shadowMeshRef.current.scale.set(shadowScale, shadowScale, 1);
            const shadowMat = shadowMeshRef.current.material as THREE.MeshBasicMaterial;
            shadowMat.opacity = 0.45 * Math.pow(1 - suckT, 2.0);
          }
        } else {
          // Smooth breathing float before suction begins
          const floatY = 0.65 + Math.sin(elapsed * 1.4) * 0.16;
          const targetHoverPerk = isBookHoveredRef.current ? 0.05 : 0;
          hoverPerkRef.current = THREE.MathUtils.lerp(hoverPerkRef.current, targetHoverPerk, delta * 6.0);
          const targetScale = isBookHoveredRef.current ? 1.31 : 1.28;
          bookScaleRef.current = THREE.MathUtils.lerp(bookScaleRef.current, targetScale, delta * 6.0);

          const tiltX = -py * 0.28 + Math.sin(elapsed * 0.9) * 0.05;
          const tiltY = px * 0.35 + Math.cos(elapsed * 0.7) * 0.07;

          bookGroupRef.current.position.set(0, floatY + hoverPerkRef.current, 0);
          bookGroupRef.current.scale.setScalar(bookScaleRef.current);
          bookGroupRef.current.rotation.x = THREE.MathUtils.lerp(bookGroupRef.current.rotation.x, tiltX, 0.06);
          bookGroupRef.current.rotation.y = THREE.MathUtils.lerp(bookGroupRef.current.rotation.y, tiltY, 0.06);
          bookGroupRef.current.rotation.z = Math.sin(elapsed * 1.1) * 0.03;

          // Shadow expands/shrinks with height and book width (narrower when closed!)
          if (shadowMeshRef.current) {
            const shadowScale = (1.0 - (floatY - 0.65) * 0.35) * 1.28;
            const widthFactor = 0.54 + bookOpenProgressRef.current * 0.46;
            shadowMeshRef.current.scale.set(shadowScale * widthFactor, shadowScale, 1);
            const shadowMat = shadowMeshRef.current.material as THREE.MeshBasicMaterial;
            shadowMat.opacity = 0.45 - (floatY - 0.65) * 0.18;
          }
        }
      }

      // Smooth Book Open / Close Kinematics & Hover VFX
      let targetOpen = 1.0;
      if (bookSuckProgressRef.current > 0) {
        // As book is pulled towards the singularity, aerodynamic gravitational slipstream smoothly folds it shut
        targetOpen = Math.max(0.0, 1.0 - bookSuckProgressRef.current * 2.8);
      }
      bookOpenProgressRef.current = THREE.MathUtils.lerp(bookOpenProgressRef.current, targetOpen, delta * 4.8);
      const openT = bookOpenProgressRef.current;
      const isClosing = bookSuckProgressRef.current > 0;
      const isOpening = false;

      if (leftCoverRef.current && rightCoverRef.current && leftStackRef.current && rightStackRef.current && bookInnerGroupRef.current) {
        // Smooth opening angle interpolations: front cover uncurls from Math.PI down to openAngle
        const curLeftAngle = THREE.MathUtils.lerp(Math.PI, openAngle, openT);
        const curRightAngle = THREE.MathUtils.lerp(0, -openAngle, openT);

        // Contact-flush Z positions (Zero voids, zero overlapping clipping):
        const curLeftZ = THREE.MathUtils.lerp(pD + bD / 2, 0, openT);
        const curLeftStackZ = THREE.MathUtils.lerp(pD, bD / 2, openT);
        const curRightCoverZ = THREE.MathUtils.lerp(-zMid + bD / 2, 0, openT);
        const curRightStackZ = THREE.MathUtils.lerp(-zMid + bD, bD / 2, openT);
        const curInnerX = THREE.MathUtils.lerp(-bW / 2, 0, openT);

        leftCoverRef.current.rotation.y = curLeftAngle;
        leftCoverRef.current.position.z = curLeftZ;

        leftStackRef.current.rotation.y = curLeftAngle;
        leftStackRef.current.position.z = curLeftStackZ;

        rightCoverRef.current.rotation.y = curRightAngle;
        rightCoverRef.current.position.z = curRightCoverZ;

        rightStackRef.current.rotation.y = curRightAngle;
        rightStackRef.current.position.z = curRightStackZ;

        bookInnerGroupRef.current.position.x = curInnerX;

        // Dynamic spine backing & ribs adjustment:
        if (spineRef.current) {
          const curSpineZ = THREE.MathUtils.lerp(0, -0.05, openT);
          const curSpineScale = THREE.MathUtils.lerp(1.0, 0.58, openT);
          spineRef.current.position.set(0, 0, curSpineZ);
          spineRef.current.scale.set(curSpineScale, 1.0, curSpineScale);
        }

        if (topHeadbandRef.current && bottomTailbandRef.current) {
          const curBandZ = THREE.MathUtils.lerp(0, 0.08, openT);
          topHeadbandRef.current.position.z = curBandZ;
          bottomTailbandRef.current.position.z = curBandZ;
        }

        // Flippable Pages: Realistic Dynamic Turnover Kinematics, Bending Curl & VFX
        if (!isBookConsumedRef.current) {
          const pages = flippablePagesRef.current;

          // If the book has fully closed and cursor is away, reset pages to the balanced initial spread (3 left, 3 right)
          // so next time the user hovers, the book opens cleanly and ready to flip in both directions
          if (isClosing && openT <= 0.02) {
            pages.forEach((p) => {
              const initP = p.pageIndex < 3 ? 1.0 : 0.0;
              p.progress = initP;
              p.targetProgress = initP;
              p.isFlipping = false;
              p.landingTimer = 0;
            });
          }

          const rightStackAngle = curRightAngle;
          const leftStackAngle = curLeftAngle - Math.PI;

          pages.forEach((page) => {
            // Update flip progress
            if (page.isFlipping) {
              const actualFlipSpeed = isClosing ? Math.max(page.flipSpeed, 3.2) : page.flipSpeed;
              const dir = page.targetProgress > page.progress ? 1 : -1;
              page.progress += dir * delta * actualFlipSpeed;
              if (dir > 0 && page.progress >= page.targetProgress) {
                page.progress = page.targetProgress;
                page.isFlipping = false;
                page.landingTimer = isClosing ? 0 : 0.35; // no landing flutter if closing
              } else if (dir < 0 && page.progress <= page.targetProgress) {
                page.progress = page.targetProgress;
                page.isFlipping = false;
                page.landingTimer = isClosing ? 0 : 0.35;
              }
            }

            if (page.landingTimer > 0) {
              page.landingTimer = Math.max(0, page.landingTimer - delta);
            }

            const p = page.progress;
            page.group.visible = openT > 0.02;

            // Target angles:
            // Right stack rests at rightStackAngle (curRightAngle: lerps between 0 when closed and -openAngle when open)
            // Left stack rests at leftStackAngle (curLeftAngle - Math.PI: lerps between 0 when closed and -Math.PI + openAngle when open)
            // Smooth natural page flip kinematics with smoothstep easing (accelerates through arc, eases onto opposite stack)
            const easedP = p * p * (3 - 2 * p);
            const targetAngle = THREE.MathUtils.lerp(rightStackAngle, leftStackAngle, isOpening ? p : easedP);

            // Staggered turnover fan-out wave ONLY during book opening (never when closing!)
            let openingRipple = 0;
            if (isOpening) {
              const stagger = (5 - page.pageIndex) * 0.08;
              const openWaveT = Math.max(0, Math.min(1, (openT - stagger) / 0.6));
              openingRipple = Math.sin(openWaveT * Math.PI) * (1 - openT) * 0.38;
            }

            const curAngle = targetAngle + openingRipple;
            page.group.rotation.y = curAngle;

            // Spine Hinge Position: 100% STEADY and anchored firmly into the spine seam at all times!
            // No arc lift along Z or middle carving: page origin stays seated right against the page stacks
            const zOnRight = pD + bD / 2 + (5 - page.pageIndex) * 0.005;
            const zOnLeft = pD + bD / 2 + page.pageIndex * 0.005;
            const baseZ = THREE.MathUtils.lerp(zOnRight, zOnLeft, p);
            const closedZ = bD / 2 + pD + (5 - page.pageIndex) * 0.003;
            const curZ = THREE.MathUtils.lerp(closedZ, baseZ, openT);
            page.group.position.set(0, 0, curZ);

            // Ensure crisp, steady planar geometry with zero warping, cavity, or carved distortion
            const posF = page.frontGeo.attributes.position as THREE.BufferAttribute;
            const posB = page.backGeo.attributes.position as THREE.BufferAttribute;
            let needsReset = false;
            for (let v = 0; v < posF.count; v++) {
              if (posF.getZ(v) !== 0 || posB.getZ(v) !== 0) {
                posF.setZ(v, 0);
                posB.setZ(v, 0);
                needsReset = true;
              }
            }
            if (needsReset) {
              posF.needsUpdate = true;
              posB.needsUpdate = true;
              page.frontGeo.computeVertexNormals();
              page.backGeo.computeVertexNormals();
            }
          });

          // Page Flip Particle Sparkles Update
          if (flipSparklesRef.current && flipSparklesRef.current.life > 0) {
            const fs = flipSparklesRef.current;
            fs.life = Math.max(0, fs.life - delta);
            const count = fs.velocities.length / 3;
            for (let s = 0; s < count; s++) {
              const sx = fs.posAttr.getX(s) + fs.velocities[s * 3] * delta;
              const sy = fs.posAttr.getY(s) + fs.velocities[s * 3 + 1] * delta;
              const sz = fs.posAttr.getZ(s) + fs.velocities[s * 3 + 2] * delta;
              fs.posAttr.setXYZ(s, sx, sy, sz);
            }
            fs.posAttr.needsUpdate = true;
            const mat = fs.points.material as THREE.PointsMaterial;
            mat.opacity = (fs.life / fs.maxLife) * 0.95;
          }
        }

        // Hover VFX: Celestial Aura flare & Sparkles
        if (bookAuraLightRef.current) {
          const flare = Math.sin(openT * Math.PI) * 3.2;
          bookAuraLightRef.current.intensity = (openT * 0.6) + flare;
        }

        if (bookHoverSparklesRef.current) {
          const sMat = bookHoverSparklesRef.current.material as THREE.PointsMaterial;
          sMat.opacity = Math.sin(openT * Math.PI) * 0.85;
          bookHoverSparklesRef.current.rotation.y = elapsed * 0.5;
        }
      }

      // 1. Natural Circular Airflow Orbit & Dynamic Random Path for Anime Floating Sheets
      pageItemsRef.current.forEach((item) => {
        if (item.state !== 'orbiting') return;

        // Airflow orbital progression
        const vortexBoost = isChaosModeRef.current ? (1.0 + portalAppearProgressRef.current * 0.6) : 1.0;
        item.orbitAngle += delta * item.orbitSpeed * vortexBoost;

        // Multi-frequency thermal updrafts and random airflow gusts
        const gustR = Math.sin(elapsed * 0.35 + item.phaseR) * 0.55 + Math.cos(elapsed * 0.20 + item.phaseR * 1.4) * 0.25;
        const gustY = Math.sin(elapsed * 0.45 + item.phaseY) * 0.60 + Math.cos(elapsed * 0.25 + item.phaseY * 1.2) * 0.30;
        const gustZ = Math.sin(elapsed * 0.30 + item.phaseZ) * 0.40 + Math.sin(elapsed * 0.16 + item.phaseZ * 0.7) * 0.20;

        let currentR = item.baseRadius + gustR;
        // In chaos mode, gently drawn into accretion halo without touching singularity
        if (isChaosModeRef.current && portalAppearProgressRef.current > 0.5) {
          currentR = Math.max(3.8, currentR * (1.0 - portalAppearProgressRef.current * 0.12));
        }

        const cosA = Math.cos(item.orbitAngle);
        const sinA = Math.sin(item.orbitAngle);

        let targetX = cosA * currentR;
        let targetY = 0.65 + sinA * currentR * Math.cos(item.tiltX) + gustY;
        let targetZ = sinA * currentR * Math.sin(item.tiltZ) + gustZ;

        // Pointer aerodynamic air wake perturbation
        const dx = targetX - px * 5.5;
        const dy = targetY - py * 3.5;
        const dist = Math.hypot(dx, dy);
        if (dist < 3.0) {
          const force = ((3.0 - dist) / 3.0) * 0.15;
          item.repulsionOffset.x += (dx / dist) * force;
          item.repulsionOffset.y += (dy / dist) * force;
        }

        item.currentPos.set(targetX, targetY, targetZ);
      });

      // 2. Strict Pairwise Separation Physics (Mathematically Eliminates Overlaps between orbiting pages)
      const MIN_PAGE_DIST = 2.6; // sheets are 1.28x1.70; 2.6 guarantees generous clearance
      const pages = pageItemsRef.current;
      for (let i = 0; i < pages.length; i++) {
        for (let j = i + 1; j < pages.length; j++) {
          const pA = pages[i];
          const pB = pages[j];
          if (pA.state !== 'orbiting' || pB.state !== 'orbiting') continue;

          const posA = pA.mesh.position;
          const posB = pB.mesh.position;
          const ex = posA.x - posB.x;
          const ey = posA.y - posB.y;
          const ez = posA.z - posB.z;
          const distSq = ex * ex + ey * ey + ez * ez;
          if (distSq < MIN_PAGE_DIST * MIN_PAGE_DIST && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = (MIN_PAGE_DIST - dist) / MIN_PAGE_DIST;
            const pushForce = overlap * 0.045;
            const nx = ex / dist;
            const ny = ey / dist;
            const nz = ez / dist;
            pA.repulsionOffset.x += nx * pushForce;
            pA.repulsionOffset.y += ny * pushForce;
            pA.repulsionOffset.z += nz * pushForce * 1.4;
            pB.repulsionOffset.x -= nx * pushForce;
            pB.repulsionOffset.y -= ny * pushForce;
            pB.repulsionOffset.z -= nz * pushForce * 1.4;
          }
        }
      }

      // 3. Physical State Updates: Dragging, Thrown Inertia & Orbiting Flex
      pageItemsRef.current.forEach((item) => {
        const mat = item.mesh.material as THREE.MeshStandardMaterial;

        // ----------------------------------------------------
        // STATE A: DRAGGING (Grabbed by cursor)
        // ----------------------------------------------------
        if (item.state === 'dragging') {
          // Responsive physical spring tracking
          item.mesh.position.lerp(item.grabWorldPos, 0.42);

          // Tactile scale lift
          item.currentScale = THREE.MathUtils.lerp(item.currentScale, 1.15, 0.16);
          item.mesh.scale.set(item.currentScale, item.currentScale, item.currentScale);

          // Aerodynamic banking into drag velocity
          const vx = pointerVelocity3DRef.current.x;
          const vy = pointerVelocity3DRef.current.y;
          const targetTiltZ = -THREE.MathUtils.clamp(vx * 0.05, -0.6, 0.6);
          const targetTiltX = THREE.MathUtils.clamp(vy * 0.05, -0.6, 0.6);
          const targetTiltY = THREE.MathUtils.clamp(vx * 0.03, -0.4, 0.4);

          item.mesh.rotation.z = THREE.MathUtils.lerp(item.mesh.rotation.z, targetTiltZ, 0.14);
          item.mesh.rotation.x = THREE.MathUtils.lerp(item.mesh.rotation.x, targetTiltX, 0.14);
          item.mesh.rotation.y = THREE.MathUtils.lerp(item.mesh.rotation.y, targetTiltY, 0.14);

          // Dynamic drag surface flutter
          const posAttr = item.mesh.geometry.attributes.position;
          const baseCurv = item.baseCurvature;
          const dragSpeed = pointerVelocity3DRef.current.length();
          const flutterAmp = 0.038 + Math.min(0.07, dragSpeed * 0.007);
          for (let v = 0; v < posAttr.count; v++) {
            const vxVal = posAttr.getX(v);
            const vyVal = posAttr.getY(v);
            const edgeDist = Math.sqrt(vxVal * vxVal + vyVal * vyVal);
            const wave = Math.sin(elapsed * 5.2 + vxVal * 3.2 + vyVal * 2.8) * flutterAmp * edgeDist;
            posAttr.setZ(v, baseCurv[v] + wave);
          }
          posAttr.needsUpdate = true;
          return;
        }

        // ----------------------------------------------------
        // STATE B: THROWN (Fling / Throw Momentum through 3D Air)
        // ----------------------------------------------------
        if (item.state === 'thrown') {
          item.mesh.position.addScaledVector(item.velocity, delta);
          item.mesh.rotation.x += item.angularVelocity.x * delta;
          item.mesh.rotation.y += item.angularVelocity.y * delta;
          item.mesh.rotation.z += item.angularVelocity.z * delta;

          // Aerodynamic air damping
          const airDrag = Math.pow(0.978, delta * 60);
          item.velocity.multiplyScalar(airDrag);
          item.angularVelocity.multiplyScalar(Math.pow(0.965, delta * 60));
          item.throwTimer += delta;

          // Restore normal scale smoothly
          item.currentScale = THREE.MathUtils.lerp(item.currentScale, 1.0, 0.12);
          item.mesh.scale.set(item.currentScale, item.currentScale, item.currentScale);

          // Check if thrown completely out of screen:
          const p = item.mesh.position;
          const isOffScreen = Math.abs(p.x) > 13.5 || Math.abs(p.y) > 8.5 || p.z < -9 || p.z > 16;

          if (isOffScreen && item.throwTimer > 0.6) {
            // Out of screen! Respawn gracefully after delay so scene stays lush & endless
            item.state = 'respawning';
            item.respawnDelay = 1.4 + Math.random() * 2.2;
          } else if (!isOffScreen && item.throwTimer > 1.2 && item.velocity.length() < 0.6) {
            // Settled gently within view: re-align smoothly into circular airflow
            item.state = 'orbiting';
            item.orbitAngle = Math.atan2(p.x, p.z);
            item.baseRadius = THREE.MathUtils.clamp(Math.hypot(p.x, p.z), 4.6, 7.8);
          }

          // Dynamic flying vertex flutter
          const posAttr = item.mesh.geometry.attributes.position;
          const baseCurv = item.baseCurvature;
          const flySpeed = item.velocity.length();
          const flutterAmp = 0.035 + Math.min(0.065, flySpeed * 0.005);
          for (let v = 0; v < posAttr.count; v++) {
            const vxVal = posAttr.getX(v);
            const vyVal = posAttr.getY(v);
            const edgeDist = Math.sqrt(vxVal * vxVal + vyVal * vyVal);
            const wave = Math.sin(elapsed * 4.6 + vxVal * 3.6 + vyVal * 2.6) * flutterAmp * edgeDist;
            posAttr.setZ(v, baseCurv[v] + wave);
          }
          posAttr.needsUpdate = true;
          return;
        }

        // ----------------------------------------------------
        // STATE C: RESPAWNING (Soft return from the outer horizon)
        // ----------------------------------------------------
        if (item.state === 'respawning') {
          item.respawnDelay -= delta;
          mat.transparent = true;
          mat.opacity = 0;
          item.mesh.visible = false;

          if (item.respawnDelay <= 0) {
            // Re-emerge smoothly on the outer orbit boundary
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnR = 6.6 + Math.random() * 1.5;
            item.baseRadius = 5.0 + (item.id % 3) * 1.0;
            item.orbitAngle = spawnAngle;
            const spawnX = Math.cos(spawnAngle) * spawnR;
            const spawnY = 0.65 + Math.sin(spawnAngle) * spawnR * Math.cos(item.tiltX);
            const spawnZ = -2.5 - Math.random() * 2.0;
            item.mesh.position.set(spawnX, spawnY, spawnZ);
            item.currentPos.set(spawnX, spawnY, spawnZ);
            item.velocity.set(0, 0, 0);
            item.angularVelocity.set(0, 0, 0);
            item.currentScale = 1.0;
            item.mesh.scale.set(1, 1, 1);
            item.mesh.visible = true;
            item.state = 'orbiting';
            mat.opacity = 0.04;
          }
          return;
        }

        // ----------------------------------------------------
        // STATE D: NORMAL ORBITING (Airflow stream around book)
        // ----------------------------------------------------
        if (mat.opacity < 1.0) {
          mat.opacity = Math.min(1.0, mat.opacity + delta * 1.2);
          if (mat.opacity >= 0.99) mat.transparent = false;
        }

        item.currentScale = THREE.MathUtils.lerp(item.currentScale, 1.0, 0.1);
        item.mesh.scale.set(item.currentScale, item.currentScale, item.currentScale);

        // Damping of repulsion impulse
        item.repulsionOffset.multiplyScalar(0.92);

        // Position with repulsion applied
        const finalX = item.currentPos.x + item.repulsionOffset.x;
        const finalY = item.currentPos.y + item.repulsionOffset.y;
        const finalZ = item.currentPos.z + item.repulsionOffset.z;

        item.mesh.position.x = THREE.MathUtils.lerp(item.mesh.position.x, finalX, 0.06);
        item.mesh.position.y = THREE.MathUtils.lerp(item.mesh.position.y, finalY, 0.06);
        item.mesh.position.z = THREE.MathUtils.lerp(item.mesh.position.z, finalZ, 0.06);

        // Tangential Aerodynamic Velocity & Banking:
        const vx = -Math.sin(item.orbitAngle) * item.orbitSpeed;
        const vy = Math.cos(item.orbitAngle) * item.orbitSpeed * Math.cos(item.tiltX);
        const vz = Math.cos(item.orbitAngle) * item.orbitSpeed * Math.sin(item.tiltZ);

        const flowHeading = Math.atan2(vx, vz);
        const flutter = Math.sin(elapsed * item.flutterSpeed + item.flutterPhase);
        const flutterCos = Math.cos(elapsed * (item.flutterSpeed * 0.85) + item.flutterPhase);

        // Natural aerodynamic orientation: yaw aligned with velocity, pitch into the breeze, roll banking into the orbit
        const targetRotX = -vy * 0.7 + item.tiltX + flutter * 0.12;
        const targetRotY = flowHeading + Math.PI / 2 + flutterCos * 0.14;
        const targetRotZ = (vx * 0.32) + Math.sin(elapsed * 0.5 + item.phaseZ) * 0.15;

        item.mesh.rotation.x = THREE.MathUtils.lerp(item.mesh.rotation.x, targetRotX, 0.04);
        item.mesh.rotation.y = THREE.MathUtils.lerp(item.mesh.rotation.y, targetRotY, 0.04);
        item.mesh.rotation.z = THREE.MathUtils.lerp(item.mesh.rotation.z, targetRotZ, 0.04);

        // Dynamic Physical Airflow Flexing across the surface (curved paper rippling in wind)
        const posAttr = item.mesh.geometry.attributes.position;
        const baseCurv = item.baseCurvature;
        for (let v = 0; v < posAttr.count; v++) {
          const vxVal = posAttr.getX(v);
          const vyVal = posAttr.getY(v);
          const edgeDist = Math.sqrt(vxVal * vxVal + vyVal * vyVal);
          const wave = Math.sin(elapsed * 2.8 + vxVal * 2.5 + vyVal * 2.0 + item.flutterPhase) * 0.035 * edgeDist;
          posAttr.setZ(v, baseCurv[v] + wave);
        }
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    // ==========================================
    // 11. POINTER INTERACTION
    // ==========================================
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;

      // ==========================================
      // A. IF ACTIVELY DRAGGING A SCATTERED PAGE
      // ==========================================
      if (draggedPageRef.current) {
        const page = draggedPageRef.current;
        const moveDist = Math.hypot(e.clientX - dragPointerStartRef.current.x, e.clientY - dragPointerStartRef.current.y);
        if (moveDist > 4) {
          hasMovedDragRef.current = true;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

        if (raycaster.ray.intersectPlane(dragPlaneRef.current, dragPlaneIntersectRef.current)) {
          const targetWorldPos = dragPlaneIntersectRef.current.clone().add(page.dragOffset);
          page.grabWorldPos.copy(targetWorldPos);

          const now = performance.now();
          const dt = Math.max(0.008, (now - lastPointerTimeRef.current) / 1000);
          if (dt < 0.25) {
            const instVel = targetWorldPos.clone().sub(lastPointerPos3DRef.current).divideScalar(dt);
            pointerVelocity3DRef.current.lerp(instVel, 0.45);
          }
          lastPointerPos3DRef.current.copy(targetWorldPos);
          lastPointerTimeRef.current = now;
        }

        container.style.cursor = 'grabbing';
        return;
      }

      // ==========================================
      // B. NORMAL HOVER CHECKS
      // ==========================================
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

      // 1. Check if hovering the central hero book (with spatial proximity for smooth, reliable interaction)
      if (bookGroupRef.current) {
        const bookHits = raycaster.intersectObjects(bookGroupRef.current.children, true);
        const isNearBook = Math.abs(normX) < 0.38 && Math.abs(normY) < 0.46;
        const forceHover = (window as unknown as { __forceBookHover?: boolean }).__forceBookHover;
        const isHovering = forceHover !== undefined ? forceHover : (bookHits.length > 0 || isNearBook);

        if (isHovering !== isBookHoveredRef.current) {
          isBookHoveredRef.current = isHovering;
          if (isHovering) {
            archiveAudio.playPaperRustle();
          }
        }
        if (isHovering) {
          container.style.cursor = 'pointer';
          return;
        }
      } else {
        isBookHoveredRef.current = false;
      }

      // 2. Check if hovering floating scattered artifact pages -> display 'grab' cursor!
      const hits = raycaster.intersectObjects(pagesGroup.children, true);
      if (hits.length > 0 && hits[0].object.userData?.isPage) {
        container.style.cursor = 'grab';
        return;
      }

      container.style.cursor = 'default';
    };

    const handlePointerLeave = () => {
      const forceHover = (window as unknown as { __forceBookHover?: boolean }).__forceBookHover;
      if (forceHover === undefined) {
        isBookHoveredRef.current = false;
      }
      if (!draggedPageRef.current) {
        container.style.cursor = 'default';
      }
    };

    const handleBookClick = (clickParam?: number | { clientX?: number; clientY?: number } | MouseEvent | PointerEvent) => {
      isBookHoveredRef.current = true;
      const pages = flippablePagesRef.current;
      if (!pages || pages.length === 0) return;

      let xCoord: number | undefined;
      if (typeof clickParam === 'number') {
        xCoord = clickParam;
      } else if (clickParam && typeof clickParam === 'object' && 'clientX' in clickParam && typeof (clickParam as { clientX: number }).clientX === 'number') {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        xCoord = (clickParam as { clientX: number }).clientX - cx;
      }

      // Exact user requirement:
      // "when we click on right side og book ; page turn right ; and when we click on left side it turnover page on left ok"
      // Right side of book: xCoord > 0 (or undefined defaults to right)
      // Left side of book: xCoord <= 0
      const isRightClick = xCoord === undefined ? true : xCoord > 0;

      // Find available resting pages on right and left stacks
      const rightPages = pages.filter((p) => p.progress <= 0.05 && !p.isFlipping);
      const leftPages = pages.filter((p) => p.progress >= 0.95 && !p.isFlipping);

      let chosenPage: FlippablePageItem | null = null;
      let targetProgress = 0.0;

      // Check if any page is currently in-flight
      const moving = pages.find((p) => p.isFlipping);

      if (isRightClick) {
        // Page turns RIGHT (targetProgress = 0.0)
        targetProgress = 0.0;
        if (moving && moving.targetProgress !== 0.0) {
          // If a page was turning left, smoothly reverse it back to the right!
          moving.targetProgress = 0.0;
          archiveAudio.playPageTurn();
          return;
        }
        if (leftPages.length > 0) {
          // Take topmost page on left stack and flip it over to the right
          chosenPage = leftPages[leftPages.length - 1];
        }
      } else {
        // Page turns over on LEFT (targetProgress = 1.0)
        targetProgress = 1.0;
        if (moving && moving.targetProgress !== 1.0) {
          // If a page was turning right, smoothly reverse it to the left!
          moving.targetProgress = 1.0;
          archiveAudio.playPageTurn();
          return;
        }
        if (rightPages.length > 0) {
          // Take topmost page on right stack and turnover to the left
          chosenPage = rightPages[0];
        }
      }

      if (chosenPage) {
        chosenPage.targetProgress = targetProgress;
        chosenPage.isFlipping = true;
        chosenPage.flipSpeed = 1.35; // Luscious 0.74s cinematic page flip

        // Tactile organic page turn audio synthesis
        archiveAudio.playPageTurn();

        // Celestial Aura flare on flip
        if (bookAuraLightRef.current) {
          bookAuraLightRef.current.intensity = 2.9;
        }

        // Trigger golden radiant star trail at page edge
        triggerFlipSparkles(chosenPage.pageIndex, targetProgress);
      } else {
        // Subtle paper rustle when at the stack boundary
        archiveAudio.playPaperRustle();
      }
    };

    let lastBookClickTime = 0;
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      // Don't intercept clicks on navigation buttons or sound toggle
      const targetEl = e.target as HTMLElement | null;
      if (targetEl && targetEl.closest('button, a, nav, header')) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

      // 1. Check if clicked the book (Smooth page turnover animation on every click!)
      if (bookGroupRef.current) {
        const bookHits = raycaster.intersectObjects(bookGroupRef.current.children, true);
        const isNearBook = Math.abs(normX) < 0.42 && Math.abs(normY) < 0.52;

        if (bookHits.length > 0 || isNearBook) {
          const nowMs = performance.now();
          if (nowMs - lastBookClickTime < 180) return;
          lastBookClickTime = nowMs;

          isBookHoveredRef.current = true;

          // Calculate local hit coordinate along book width to detect left vs right page
          let hitX = normX;
          if (bookHits.length > 0) {
            const hitPoint = bookHits[0].point;
            const localPoint = bookGroupRef.current.worldToLocal(hitPoint.clone());
            hitX = localPoint.x;
          }

          handleBookClick(hitX);

          const now = Date.now();
          const times = [...bookClickTimesRef.current, now].filter((t) => now - t < 1200);
          bookClickTimesRef.current = times;

          if (times.length >= 8) {
            bookClickTimesRef.current = [];
            archiveAudio.playChaosGlitch();
            onTriggerChaos();
          }
          return;
        }
      }

      // 2. Check if clicked an orbiting scattered anime page -> GRAB & PREPARE FOR DRAG / THROW!
      const hits = raycaster.intersectObjects(pagesGroup.children, true);
      if (hits.length > 0 && hits[0].object.userData?.isPage) {
        const hitMesh = hits[0].object as THREE.Mesh;
        const pageIdx = hitMesh.userData?.pageIndex;
        const hitItem = pageItemsRef.current.find((p) => p.mesh === hitMesh || p.id === pageIdx);

        if (hitItem) {
          draggedPageRef.current = hitItem;
          dragPointerStartRef.current = { x: e.clientX, y: e.clientY };
          hasMovedDragRef.current = false;

          // Establish camera-facing drag plane at the page's current 3D position
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(camDir.negate(), hitItem.mesh.position);

          if (raycaster.ray.intersectPlane(dragPlaneRef.current, dragPlaneIntersectRef.current)) {
            hitItem.dragOffset.copy(hitItem.mesh.position).sub(dragPlaneIntersectRef.current);
            hitItem.grabWorldPos.copy(hitItem.mesh.position);
          } else {
            hitItem.dragOffset.set(0, 0, 0);
            hitItem.grabWorldPos.copy(hitItem.mesh.position);
          }

          hitItem.state = 'dragging';
          hitItem.velocity.set(0, 0, 0);
          hitItem.angularVelocity.set(0, 0, 0);
          hitItem.targetScale = 1.15;

          lastPointerPos3DRef.current.copy(hitItem.mesh.position);
          lastPointerTimeRef.current = performance.now();
          pointerVelocity3DRef.current.set(0, 0, 0);

          archiveAudio.playPaperRustle();
          container.style.cursor = 'grabbing';
          return;
        }
      }
    };

    const handlePointerUp = () => {
      if (!draggedPageRef.current) return;

      const page = draggedPageRef.current;
      draggedPageRef.current = null;
      container.style.cursor = 'default';

      // 1. Did the user merely tap/click without dragging?
      if (!hasMovedDragRef.current) {
        page.state = 'orbiting';
        page.targetScale = 1.0;
        if (page.isArtifact && page.artifact) {
          archiveAudio.playInspectChime();
          onSelectArtifact(page.artifact);
        }
        return;
      }

      // 2. User dragged or threw the page!
      page.targetScale = 1.0;
      const throwSpeed = pointerVelocity3DRef.current.length();

      if (throwSpeed > 2.0) {
        // High-velocity THROW!
        page.state = 'thrown';
        page.throwTimer = 0;

        // Multiply speed for satisfying throw momentum:
        const boost = Math.min(1.85, 1.15 + throwSpeed * 0.05);
        page.velocity.copy(pointerVelocity3DRef.current).multiplyScalar(boost);
        page.velocity.z += (Math.random() - 0.5) * 3.0;

        // Realistic 3D tumbling angular velocity:
        page.angularVelocity.set(
          (Math.random() - 0.5) * 8.0 + page.velocity.y * 0.45,
          (Math.random() - 0.5) * 8.0 - page.velocity.x * 0.45,
          (Math.random() - 0.5) * 6.0
        );

        // Procedural whoosh audio:
        archiveAudio.playPageWhoosh(Math.min(1.0, throwSpeed / 12));
      } else {
        // Gentle release: seamlessly blend back into circular airflow
        page.state = 'orbiting';
        const p = page.mesh.position;
        page.orbitAngle = Math.atan2(p.x, p.z);
        page.baseRadius = THREE.MathUtils.clamp(Math.hypot(p.x, p.z), 4.5, 8.0);
        archiveAudio.playPaperRustle();
      }
    };

    // Expose helpers for testing and interactive verification
    const helperObj = (window as unknown as {
      __setBookHover?: (hover: boolean) => void;
      __flipBookPage?: (x?: number) => void;
      __getPagesState?: () => unknown;
      __setPageProgress?: (pageIndex: number, progress: number) => void;
      __setChaosState?: (params: { suckProgress?: number; portalScale?: number; isConsumed?: boolean; freeze?: boolean }) => void;
      __throwPage?: (pageIndex: number, vx: number, vy: number, vz: number) => void;
      __dragPageTo?: (pageIndex: number, x: number, y: number, z: number) => void;
      __getPagePhysicalState?: (pageIndex: number) => unknown;
    });

    helperObj.__setBookHover = (hover: boolean) => {
      isBookHoveredRef.current = hover;
      (window as unknown as { __forceBookHover?: boolean }).__forceBookHover = hover;
    };
    helperObj.__flipBookPage = (x?: number | { clientX?: number; clientY?: number }) => handleBookClick(x);
    helperObj.__setPageProgress = (pageIndex: number, progress: number) => {
      const p = flippablePagesRef.current[pageIndex];
      if (p) {
        p.progress = progress;
        p.targetProgress = progress;
        p.isFlipping = false;
      }
    };
    helperObj.__getPagesState = () =>
      flippablePagesRef.current.map((p) => ({ idx: p.pageIndex, progress: p.progress, isFlipping: p.isFlipping }));
    helperObj.__throwPage = (pageIndex: number, vx: number, vy: number, vz: number) => {
      const page = pageItemsRef.current[pageIndex];
      if (page) {
        page.state = 'thrown';
        page.throwTimer = 0;
        page.velocity.set(vx, vy, vz);
        page.angularVelocity.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 4);
        archiveAudio.playPageWhoosh(1.0);
      }
    };
    helperObj.__dragPageTo = (pageIndex: number, x: number, y: number, z: number) => {
      const page = pageItemsRef.current[pageIndex];
      if (page) {
        page.state = 'dragging';
        page.grabWorldPos.set(x, y, z);
      }
    };
    helperObj.__getPagePhysicalState = (pageIndex: number) => {
      const p = pageItemsRef.current[pageIndex];
      if (!p) return null;
      return {
        id: p.id,
        state: p.state,
        pos: [p.mesh.position.x, p.mesh.position.y, p.mesh.position.z],
        vel: [p.velocity.x, p.velocity.y, p.velocity.z],
        scale: p.currentScale,
      };
    };
    helperObj.__setChaosState = (params) => {
      if (params.freeze !== undefined) {
        (window as unknown as { __freezeChaos?: boolean }).__freezeChaos = params.freeze;
      }
      if (params.suckProgress !== undefined) {
        bookSuckProgressRef.current = params.suckProgress;
        if (params.suckProgress < 0.999) {
          isBookConsumedRef.current = false;
          postConsumptionTimerRef.current = 0;
          portalCloseProgressRef.current = 0;
          isPortalClosedRef.current = false;
        }
        if (bookGroupRef.current) bookGroupRef.current.visible = true;
      }
      if (params.isConsumed !== undefined) isBookConsumedRef.current = params.isConsumed;
      if (params.portalScale !== undefined) {
        portalOpenRef.current = true;
        portalAppearProgressRef.current = params.portalScale;
        isPortalClosedRef.current = false;
        portalCloseProgressRef.current = 0;
      }
    };

    const onMove = (e: PointerEvent) => handlePointerMove(e);
    const onUp = () => handlePointerUp();

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [createAnimePageTexture, createShadowTexture, onSelectArtifact, onTriggerChaos]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none touch-none"
      aria-hidden="true"
    />
  );
}
