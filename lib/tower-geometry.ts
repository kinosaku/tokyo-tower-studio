/**
 * AI-generated original procedural Tokyo Tower study.
 * Units: 1 = 100 metres; Y is up; ground is Y=0.
 * Only the headline heights (333 m, 150 m, 250 m) are factual. All member,
 * footprint and deck dimensions are illustrative approximations, not surveyed
 * engineering geometry. No external mesh or reference-project code is used.
 *
 * Sources: https://www.tokyotower.co.jp/guidance/
 * https://en.tokyotower.co.jp/plan/towerpedia/
 */
export type TowerSectionId =
  | 'foundation' | 'legs' | 'lower' | 'main-deck'
  | 'upper' | 'top-deck' | 'spire';

export interface TowerPart {
  id: string;
  section: TowerSectionId;
  name: string;
  shape: 'beam' | 'box' | 'cylinder';
  position: [number, number, number];
  size: [number, number, number];
  color: 'orange' | 'white' | 'glass' | 'dark' | 'concrete';
  rotation?: [number, number, number];
  from?: [number, number, number];
  to?: [number, number, number];
}

type V3 = [number, number, number];
type Color = TowerPart['color'];
type Level = readonly [height: number, halfWidth: number];

export function createTowerParts(): TowerPart[] {
  const parts: TowerPart[] = [];
  const counts = new Map<TowerSectionId, number>();
  const bandHeight = (3.33 - 1.50) / 7;
  const corners: readonly (readonly [number, number])[] = [
    [-1, -1], [1, -1], [1, 1], [-1, 1],
  ];
  const bandBoundaries = Array.from({ length: 6 }, (_, i) => 1.50 + (i + 1) * bandHeight);

  function add(part: Omit<TowerPart, 'id'>): void {
    const ordinal = (counts.get(part.section) ?? 0) + 1;
    counts.set(part.section, ordinal);
    parts.push({ id: `${part.section}-${String(ordinal).padStart(3, '0')}`, ...part });
  }

  function paint(y: number): Color {
    if (y < 1.50) return 'orange';
    const band = Math.min(6, Math.max(0, Math.floor((y - 1.50) / bandHeight)));
    return band % 2 === 0 ? 'orange' : 'white';
  }

  function lerp(a: V3, b: V3, t: number): V3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function beam(section: TowerSectionId, name: string, from: V3, to: V3, radius: number, color?: Color): void {
    // Split at paint boundaries so slanting members preserve horizontal bands.
    const cuts = [0, 1];
    if (!color && Math.abs(to[1] - from[1]) > 1e-9) {
      for (const y of bandBoundaries) {
        const t = (y - from[1]) / (to[1] - from[1]);
        if (t > 1e-6 && t < 1 - 1e-6) cuts.push(t);
      }
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = lerp(from, to, cuts[i]);
      const b = lerp(from, to, cuts[i + 1]);
      const position = lerp(a, b, 0.5);
      add({ section, name: cuts.length > 2 ? `${name} / paint segment ${i + 1}` : name,
        shape: 'beam', position, size: [radius, 0, 0], color: color ?? paint(position[1]), from: a, to: b });
    }
  }

  function box(section: TowerSectionId, name: string, position: V3, size: V3, color: Color, rotation?: V3): void {
    add({ section, name, shape: 'box', position, size, color, ...(rotation ? { rotation } : {}) });
  }

  function cylinder(section: TowerSectionId, name: string, y: number, radiusTop: number, radiusBottom: number, height: number, color: Color): void {
    add({ section, name, shape: 'cylinder', position: [0, y, 0], size: [radiusTop, radiusBottom, height], color,
      ...(section === 'top-deck' ? { rotation: [0, Math.PI / 8, 0] as V3 } : {}) });
  }

  function cornerPoint(level: Level, corner: number): V3 {
    const [x, z] = corners[corner];
    return [x * level[1], level[0], z * level[1]];
  }

  function squareTruss(section: TowerSectionId, levels: readonly Level[], chordRadius: number, braceRadius: number, label: string): void {
    levels.forEach((level, tier) => {
      for (let side = 0; side < 4; side++) {
        beam(section, `${label} ring ${tier + 1} / face ${side + 1}`,
          cornerPoint(level, side), cornerPoint(level, (side + 1) % 4), braceRadius * 1.22);
      }
    });
    for (let tier = 0; tier < levels.length - 1; tier++) {
      for (let side = 0; side < 4; side++) {
        const next = (side + 1) % 4;
        beam(section, `${label} upright ${side + 1} / bay ${tier + 1}`,
          cornerPoint(levels[tier], side), cornerPoint(levels[tier + 1], side), chordRadius);
        beam(section, `${label} diagonal A / face ${side + 1} / bay ${tier + 1}`,
          cornerPoint(levels[tier], side), cornerPoint(levels[tier + 1], next), braceRadius);
        beam(section, `${label} diagonal B / face ${side + 1} / bay ${tier + 1}`,
          cornerPoint(levels[tier], next), cornerPoint(levels[tier + 1], side), braceRadius);
      }
    }
  }

  // Four broad concrete shoes; a low Foot Town volume sits between the piers.
  corners.forEach(([sx, sz], leg) => {
    box('foundation', `Pier ${leg + 1} / concrete footing`, [sx * 0.407, 0.025, sz * 0.407], [0.178, 0.05, 0.178], 'concrete');
    box('foundation', `Pier ${leg + 1} / steel shoe`, [sx * 0.407, 0.061, sz * 0.407], [0.134, 0.022, 0.134], 'dark');
  });
  box('foundation', 'Foot Town / main building', [0, 0.122, 0], [0.565, 0.184, 0.565], 'concrete');
  box('foundation', 'Foot Town / roof terrace', [0, 0.223, 0], [0.62, 0.018, 0.62], 'white');
  box('foundation', 'Foot Town / roof service core', [0, 0.245, 0], [0.14, 0.03, 0.14], 'dark');
  for (let side = 0; side < 4; side++) {
    const theta = side * Math.PI / 2;
    for (let pane = 0; pane < 7; pane++) {
      const tangent = (pane - 3) * 0.072;
      box('foundation', `Foot Town / facade ${side + 1} / window ${pane + 1}`,
        [Math.sin(theta) * 0.284 + Math.cos(theta) * tangent, 0.155,
          Math.cos(theta) * 0.284 - Math.sin(theta) * tangent],
        [0.056, 0.048, 0.005], 'glass', [0, theta, 0]);
    }
  }

  // Each splayed leg has its own four-sided, open, braced box section.
  // Empty space between the four piers makes the characteristic arch openings.
  const legLevels: readonly (readonly [number, number, number])[] = [
    [0.074, 0.407, 0.06], [0.265, 0.354, 0.055],
    [0.49, 0.294, 0.046], [0.73, 0.231, 0.038],
  ];
  corners.forEach(([sx, sz], leg) => {
    function legPoint(tier: number, corner: number): V3 {
      const [y, center, half] = legLevels[tier];
      const [cx, cz] = corners[corner];
      return [sx * center + cx * half, y, sz * center + cz * half];
    }
    legLevels.forEach((_, tier) => {
      for (let side = 0; side < 4; side++) {
        beam('legs', `Leg ${leg + 1} / collar ${tier + 1} / side ${side + 1}`,
          legPoint(tier, side), legPoint(tier, (side + 1) % 4), 0.0062, 'orange');
      }
    });
    for (let tier = 0; tier < legLevels.length - 1; tier++) {
      for (let side = 0; side < 4; side++) {
        const next = (side + 1) % 4;
        beam('legs', `Leg ${leg + 1} / primary chord ${side + 1} / bay ${tier + 1}`,
          legPoint(tier, side), legPoint(tier + 1, side), 0.0105 - tier * 0.0008, 'orange');
        beam('legs', `Leg ${leg + 1} / diagonal A / face ${side + 1} / bay ${tier + 1}`,
          legPoint(tier, side), legPoint(tier + 1, next), 0.005, 'orange');
        beam('legs', `Leg ${leg + 1} / diagonal B / face ${side + 1} / bay ${tier + 1}`,
          legPoint(tier, next), legPoint(tier + 1, side), 0.005, 'orange');
      }
    }
  });

  // Above the arch crown, full-width X bracing connects the four corners.
  squareTruss('lower', [[0.73, 0.269], [0.866, 0.235], [1.003, 0.205],
    [1.14, 0.179], [1.277, 0.156], [1.422, 0.138]], 0.011, 0.0048, 'Lower tower');
  // Slender central elevator trunk, visible through the open lower lattice.
  box('lower', 'Elevator core / lower shaft', [0, 0.824, 0], [0.047, 1.18, 0.047], 'dark');
  for (let y = 0.38; y < 1.42; y += 0.13) {
    box('lower', `Elevator core / crossbar ${Math.round(y * 100)}`, [0, y, 0], [0.066, 0.012, 0.066], 'orange');
  }

  // Two separately glazed storeys form the square Main Deck around 150 m.
  box('main-deck', 'Main Deck / lower projecting cornice', [0, 1.431, 0], [0.356, 0.022, 0.356], 'orange');
  box('main-deck', 'Main Deck / first-floor slab', [0, 1.447, 0], [0.377, 0.012, 0.377], 'white');
  box('main-deck', 'Main Deck / inter-floor band', [0, 1.499, 0], [0.378, 0.014, 0.378], 'orange');
  box('main-deck', 'Main Deck / roof cornice', [0, 1.553, 0], [0.385, 0.021, 0.385], 'white');
  box('main-deck', 'Main Deck / roof cap', [0, 1.568, 0], [0.337, 0.011, 0.337], 'orange');
  box('main-deck', 'Main Deck / interior', [0, 1.499, 0], [0.322, 0.096, 0.322], 'dark');
  for (let side = 0; side < 4; side++) {
    const theta = side * Math.PI / 2;
    for (let floor = 0; floor < 2; floor++) {
      for (let pane = 0; pane < 6; pane++) {
        const tangent = (pane - 2.5) * 0.056;
        box('main-deck', `Main Deck / floor ${floor + 1} / face ${side + 1} / glazing ${pane + 1}`,
          [Math.sin(theta) * 0.183 + Math.cos(theta) * tangent, 1.473 + floor * 0.051,
            Math.cos(theta) * 0.183 - Math.sin(theta) * tangent],
          [0.050, 0.036, 0.008], 'glass', [0, theta, 0]);
      }
    }
    for (let post = 0; post < 7; post++) {
      const tangent = (post - 3) * 0.056;
      box('main-deck', `Main Deck / facade ${side + 1} / mullion ${post + 1}`,
        [Math.sin(theta) * 0.186 + Math.cos(theta) * tangent, 1.499,
          Math.cos(theta) * 0.186 - Math.sin(theta) * tangent],
        [0.005, 0.099, 0.010], 'white', [0, theta, 0]);
    }
  }

  // Seven horizontal paint bands above Main Deck follow official color guidance.
  squareTruss('upper', [[1.574, 0.119], [1.669, 0.110], [bandBoundaries[0], 0.101],
    [1.892, 0.090], [bandBoundaries[1], 0.080], [2.153, 0.070],
    [bandBoundaries[2], 0.061], [2.370, 0.055], [2.452, 0.049]],
    0.0075, 0.0032, 'Upper tower');
  box('upper', 'Elevator core / upper shaft', [0, 2.002, 0], [0.03, 0.858, 0.03], 'dark');

  // Octagonal glazing surrounds a smaller upper observation pod at 250 m.
  // Render cylinders in this section with 8 radial segments for an octagonal rim.
  cylinder('top-deck', 'Top Deck / underside', 2.459, 0.102, 0.074, 0.025, 'white');
  cylinder('top-deck', 'Top Deck / floor rim', 2.477, 0.106, 0.106, 0.012, 'orange');
  cylinder('top-deck', 'Top Deck / interior', 2.503, 0.087, 0.087, 0.047, 'dark');
  cylinder('top-deck', 'Top Deck / roof rim', 2.535, 0.108, 0.108, 0.016, 'white');
  cylinder('top-deck', 'Top Deck / roof cap', 2.548, 0.068, 0.097, 0.010, 'white');
  for (let face = 0; face < 8; face++) {
    const theta = face * Math.PI / 4;
    box('top-deck', `Top Deck / panoramic window ${face + 1}`,
      [Math.sin(theta) * 0.096, 2.505, Math.cos(theta) * 0.096],
      [0.075, 0.044, 0.006], 'glass', [0, theta, 0]);
    const corner = theta + Math.PI / 8;
    beam('top-deck', `Top Deck / corner mullion ${face + 1}`,
      [Math.sin(corner) * 0.104, 2.482, Math.cos(corner) * 0.104],
      [Math.sin(corner) * 0.104, 2.528, Math.cos(corner) * 0.104], 0.0031, 'white');
  }

  // A stepped open antenna support changes into a narrow final aerial.
  squareTruss('spire', [[2.553, 0.039], [2.675, 0.034], [bandBoundaries[4], 0.025],
    [2.913, 0.018]], 0.0045, 0.0023, 'Antenna support');
  const antennaSteps: readonly (readonly [number, number, number, number])[] = [
    [2.913, 2.998, 0.019, 0.016], [2.998, bandBoundaries[5], 0.016, 0.014],
    [bandBoundaries[5], 3.165, 0.014, 0.012], [3.165, 3.257, 0.011, 0.007],
    [3.257, 3.330, 0.006, 0.0015],
  ];
  antennaSteps.forEach(([bottom, top, radiusBottom, radiusTop], index) => {
    cylinder('spire', `Antenna / tapered aerial stage ${index + 1}`, (bottom + top) / 2,
      radiusTop, radiusBottom, top - bottom, paint((bottom + top) / 2));
  });
  for (const y of [2.608, 2.721, 2.82, 2.929, 3.028, 3.135, 3.235]) {
    const radius = y < 2.8 ? 0.044 : y < 2.94 ? 0.03 : y < 3.1 ? 0.023 : 0.017;
    cylinder('spire', `Antenna / maintenance collar ${Math.round(y * 1000)}`, y,
      radius, radius, 0.008, paint(y));
  }
  return parts;
}
