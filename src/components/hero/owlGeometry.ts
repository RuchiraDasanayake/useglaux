import {
  CanvasTexture,
  CurvePath,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";

/**
 * Geometry constants for the procedural owl.
 *
 * The face is a direct port of the 2D `OwlMark` SVG (viewBox 0 0 32 32):
 * eyes at x=10.5 / 21.5, y=15.5 with r=4.2, irises r=1.7, and the brow path
 * "M5.5 11.5 Q10.5 7 16 11.5 Q21.5 7 26.5 11.5". SVG units map into owl
 * space through SVG_SCALE, so the hero owl is the brand mark given depth
 * rather than a separate drawing of a bird. The mark's colouring carries
 * over too: rings and brow are steel, only the irises are gold.
 *
 * The silhouette rule that makes it read as an owl and not as an egg: the
 * head is the widest mass, and the shoulders only swell past it well below
 * the head's equator. Every radius here is set to hold that.
 */

/** Head radius in owl space. Every face feature is derived from it. */
const HEAD_RADIUS = 0.666;
/** Head centre, high enough to leave a band of visible shoulder beneath it. */
export const HEAD_Y = 1;

/**
 * The mark's 32-unit box is read as a square around a 28-unit head, then
 * inset. At the mark's own proportions the eyes span three quarters of the
 * face and the thing reads as a cartoon; the inset keeps every ratio inside
 * the mark intact and simply seats the whole face furniture smaller on the
 * head, which is what a sculpture of the mark would do.
 */
const FACE_INSET = 0.8;
const SVG_SCALE = (HEAD_RADIUS / 14) * FACE_INSET;

export const EYE_X = 5.5 * SVG_SCALE;
/** SVG y=15.5, half a unit above the box centre. */
export const EYE_Y = HEAD_Y + 0.5 * SVG_SCALE;
/** The mark's r=4.2 eye circle, here as the radius of a bored-out well. */
export const EYE_WELL_RADIUS = 4.2 * SVG_SCALE;
export const IRIS_RADIUS = 1.7 * SVG_SCALE;
/**
 * The brow's thickness. Heavier than a drawn stroke would be: on a face this
 * dark the crest is the only thing above the eyes, and a hairline reads as a
 * pencil line rather than as bone. The weight is what makes the gaze look
 * considered instead of merely open.
 */
export const BROW_TUBE = 0.026;

/**
 * Depths of the face furniture. The head's front is a shallow dish that
 * rises to a crest at FACE_RIM_RADIUS, so each piece sits at its own z to
 * stay proud of the dish without floating off it.
 */
export const FACE_RIM_RADIUS = 0.6;
const EYE_LIP_Z = 0.4455;
export const FACE_DEPTHS = {
  eyeLip: EYE_LIP_Z,
  /** Seats the gold dome flush with the lip of its well. */
  iris: EYE_LIP_Z - 0.062,
  brow: 0.468,
  bezel: 0.478,
  beak: 0.452,
} as const;

/**
 * The eye, revolved about its own axis: a flat floor, a wall, and a lip.
 *
 * The mark's stroked circle became a raised steel ring in the first pass and
 * the pair of them read as spectacles. In 2D a hairline circle is a graphic,
 * in 3D it is wire. Boring the circle into the face instead gives the same
 * outline as a shadowed edge, and turns the gold from a bead sitting on a
 * face into a lens sitting in an instrument.
 */
export function createEyeWellProfile(): Vector2[] {
  // Radii as fractions of the mark's circle; z is the depth below the lip.
  return [
    [0.006, -0.075],
    [0.705, -0.075],
    [0.92, -0.066],
    [1, -0.04],
    [1.018, -0.008],
    [1.043, 0],
  ].map(([r, z]) => new Vector2(r * EYE_WELL_RADIUS, z));
}

/** Vertical extent of the whole owl, used to normalise any drop-in glTF. */
export const OWL_HEIGHT = 3.23;

const svgPoint = (x: number, y: number, z: number): Vector3 =>
  new Vector3((x - 16) * SVG_SCALE, HEAD_Y + (16 - y) * SVG_SCALE, z);

/**
 * The brow: two quadratic beziers meeting in a notch at the centre, exactly
 * as in the SVG. Planar, so the tube's Frenet frames stay untwisted.
 *
 * The notch stays level with the outer ends. Dropping it below them turns the
 * pair of crests into a frown, which is the one expression this face cannot
 * afford.
 */
export function createBrowCurve(): CurvePath<Vector3> {
  const z = FACE_DEPTHS.brow;
  const path = new CurvePath<Vector3>();
  path.add(
    new QuadraticBezierCurve3(svgPoint(5.5, 11.5, z), svgPoint(10.5, 7, z), svgPoint(16, 11.5, z)),
  );
  path.add(
    new QuadraticBezierCurve3(svgPoint(16, 11.5, z), svgPoint(21.5, 7, z), svgPoint(26.5, 11.5, z)),
  );
  return path;
}

/** Brow endpoints, used to cap the open ends of the tube. */
export const BROW_ENDS: readonly [number, number, number][] = [
  svgPoint(5.5, 11.5, FACE_DEPTHS.brow).toArray(),
  svgPoint(26.5, 11.5, FACE_DEPTHS.brow).toArray(),
];

/**
 * Head profile revolved about Z (the mesh is rotated a quarter turn on X so
 * the lathe's height axis points at the camera). The front is a shallow
 * concave dish that graduates the light across the face. A flat plate would
 * take the key light evenly and read as cardboard, rising to a crest at
 * FACE_RIM_RADIUS before the skull domes away behind it.
 */
export function createHeadProfile(): Vector2[] {
  return [
    [0.001, 0.425],
    [0.115, 0.427],
    [0.235, 0.433],
    [0.35, 0.442],
    [0.455, 0.453],
    [0.54, 0.464],
    [0.6, 0.474],
    [0.641, 0.443],
    [0.66, 0.372],
    [0.666, 0.235],
    [0.652, 0.055],
    [0.61, -0.135],
    [0.535, -0.315],
    [0.425, -0.455],
    [0.255, -0.545],
    [0.001, -0.575],
  ].map(([r, z]) => new Vector2(r, z));
}

/**
 * Face dish, a copy of the head profile's front lifted clear of it. Carrying
 * its own lighter, matte material is what makes the facial disc read as a
 * surface rather than as more skull; the head alone came out as a black
 * circle with the features floating on it.
 */
export function createFaceProfile(): Vector2[] {
  return createHeadProfile()
    .slice(0, 7)
    .map((point) => new Vector2(point.x, point.y + 0.008));
}

/**
 * Body profile revolved about Y. Two rules shape it. Its widest point
 * (0.552, five sixths of the head) only overtakes the head's silhouette
 * below y≈0.50, so the shoulders emerge from beneath the head instead of
 * swallowing it. And it tops out low enough, combined with
 * BODY_DEPTH_SCALE, that the chest never comes forward of the face dish,
 * which otherwise crops the lower face into a bib.
 */
export function createBodyProfile(): Vector2[] {
  return [
    [0.001, -1.3],
    [0.17, -1.3],
    [0.29, -1.24],
    [0.39, -1.11],
    [0.45, -0.91],
    [0.49, -0.67],
    [0.52, -0.41],
    [0.542, -0.15],
    [0.552, 0.05],
    [0.538, 0.21],
    [0.5, 0.35],
    [0.435, 0.48],
    [0.368, 0.58],
    [0.33, 0.63],
    [0.001, 0.66],
  ].map(([r, y]) => new Vector2(r, y));
}

/** Flattens the chest back behind the face dish. See createBodyProfile. */
export const BODY_DEPTH_SCALE = 0.88;

/**
 * Soft radial sprite for the iris bloom and the gleam behind the owl.
 * Generating it avoids both a texture request and a bloom pass.
 */
export function createGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 233, 190, 1)");
    gradient.addColorStop(0.22, "rgba(233, 180, 92, 0.55)");
    gradient.addColorStop(0.55, "rgba(233, 180, 92, 0.14)");
    gradient.addColorStop(1, "rgba(233, 180, 92, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Owl-space radius of the reticle's graduated ring, ~1.28x the head. */
const RETICLE_RING_RADIUS = 0.852;
/** Where the ring and the outer dashes sit in the sprite's half-extent. */
const RETICLE_RING_FRACTION = 226 / 256;
const RETICLE_EDGE_FRACTION = 246 / 256;
export const RETICLE_SPRITE_SCALE = (RETICLE_RING_RADIUS / RETICLE_RING_FRACTION) * 2;

/**
 * The box the hero fits the owl inside: the reticle's outer dashes across
 * and down to the head's chin. Everything below the chin is already
 * dissolving, so it is free to run on past the bottom of the box.
 */
const RETICLE_EDGE_RADIUS = (RETICLE_SPRITE_SCALE / 2) * RETICLE_EDGE_FRACTION;
const FRAME_TOP = HEAD_Y + RETICLE_EDGE_RADIUS;
const FRAME_CHIN = HEAD_Y - HEAD_RADIUS;

export const OWL_FRAME = {
  width: RETICLE_EDGE_RADIUS * 2,
  height: FRAME_TOP - FRAME_CHIN,
  /** Owl-space Y that should land in the middle of the slot. */
  centerY: (FRAME_TOP + FRAME_CHIN) / 2,
} as const;

/**
 * A graduated instrument ring drawn once into a canvas and shown as a single
 * billboard behind the owl. One draw call for the whole observatory cue,
 * where geometry would have cost dozens. Everything is drawn outside the
 * head's radius, so the ring frames the head instead of crossing it.
 */
export function createReticleTexture(): CanvasTexture {
  const size = 512;
  const centre = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = "rgba(233, 180, 92, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(centre, centre, 226, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(233, 180, 92, 0.66)";
    ctx.lineWidth = 2;
    for (let index = 0; index < 72; index += 1) {
      const angle = (index / 72) * Math.PI * 2;
      const inner = index % 6 === 0 ? 206 : 216;
      ctx.beginPath();
      ctx.moveTo(centre + Math.cos(angle) * inner, centre + Math.sin(angle) * inner);
      ctx.lineTo(centre + Math.cos(angle) * 226, centre + Math.sin(angle) * 226);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(141, 160, 188, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([26, 18]);
    ctx.beginPath();
    ctx.arc(centre, centre, 246, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
