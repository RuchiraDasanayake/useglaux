import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MeshStandardMaterial, SpriteMaterial } from "three";
import type { Group, Mesh, Sprite } from "three";
import type { GazeRef } from "./gaze";
import {
  BODY_DEPTH_SCALE,
  BROW_ENDS,
  BROW_TUBE,
  EYE_WELL_RADIUS,
  EYE_X,
  EYE_Y,
  FACE_DEPTHS,
  FACE_RIM_RADIUS,
  HEAD_Y,
  IRIS_RADIUS,
  createBodyProfile,
  createBrowCurve,
  createEyeWellProfile,
  createFaceProfile,
  createGlowTexture,
  createHeadProfile,
} from "./owlGeometry";

const IRIS_EMISSIVE = 0.32;
const IRIS_GLOW_OPACITY = 0.33;
const AMBIENT_GLOW_OPACITY = 0.3;
const EYE_GLOW_SCALE = 0.29;

/**
 * How far the head turns to follow the pointer, in radians.
 *
 * An owl's neck is the whole point of the animal, so the head does the
 * tracking and the body stays where it is. The cap is what keeps it a bird
 * rather than a puppet: past roughly twenty degrees of yaw the facial disc
 * turns three-quarter, the far eye slides behind the skull's rim, and the
 * mark stops being legible as the mark.
 */
const MAX_YAW = 0.33;
const MAX_PITCH = 0.16;
/** A curious tilt riding along with the turn. Small, or it reads as a shrug. */
const MAX_ROLL = 0.07;
/** Residual drift when the pointer is centred, absent, or on a touch screen. */
const IDLE_YAW = 0.1;
/** How far the irises lead the head within their wells, in owl units. */
const EYE_LEAD = 0.03;

/**
 * How quickly the head arrives at wherever it is looking.
 *
 * Deliberately slow. Nothing on this face changes shape, so the whole of its
 * character is in the timing: a head that snaps to the pointer reads as an
 * alarmed animal, and the same head arriving a beat late reads as one that
 * had already decided to look.
 */
const TRACK_DAMP = 3.4;

/**
 * Blink timing. Rare, and slow enough to be a considered blink rather than a
 * flinch: the eyes are the only lit thing on the face, so closing them is the
 * loudest move the owl has.
 */
const BLINK_DURATION = 0.22;
const BLINK_GAP_MIN = 6;
const BLINK_GAP_RANGE = 6.5;

/** Left eye, then right. The frame loop indexes its refs in this order. */
const EYE_POSITIONS = [-EYE_X, EYE_X] as const;

/**
 * How far the body is seated below the head.
 *
 * The torso is a wide lathe and the skull's front curves away sharply at its
 * rim, so where the two overlap the chest wins the depth test and lays a bib
 * across the lower face. Dropping the body until only its neck reaches the
 * chin puts the whole of it behind the head at every angle.
 */
const BODY_DROP = -0.26;

/**
 * Where the body starts to dissolve and where it is fully gone, in the body
 * profile's own space: the shader reads object-space Y, which BODY_DROP
 * does not move.
 *
 * The band closes above the torso's widest point. Half-fading the bulge is
 * not enough to lose it: the body is already close to the background in
 * value, so what actually reads is the sheen along its shoulders, and a
 * half-strength sheen is still a sheen. Only ending the fade before the
 * widest point leaves a bust in the dark rather than a lump with a head.
 */
const FADE_TOP = 0.46;
const FADE_BOTTOM = 0.1;
/** How steeply the body's grazing-angle edges melt into the background. */
const EDGE_FADE = 0.55;
/** --nyx, #070b12, as the sRGB triple the fragment shader mixes toward. */
const NYX_RGB = "vec3( 0.0275, 0.0431, 0.0706 )";

/**
 * Dissolves the body into the page background two ways: downward, so the owl
 * reads as a bust rising out of the dark rather than a whole body with a
 * silhouetted bottom edge, and at grazing angles, so its sides melt off
 * instead of ending on a hard cut-out edge. Without the second one the torso
 * reads as a column with parallel sides on narrow viewports.
 *
 * Doing this in the shader keeps the composition identical at every aspect
 * ratio, which a scrim painted over the canvas cannot: the copy moves with
 * the viewport, the owl does not.
 *
 * The mix runs after the colour-space conversion, so it interpolates in the
 * same sRGB space as the page background and lands on exactly --nyx.
 */
function withHeightFade(material: MeshStandardMaterial): MeshStandardMaterial {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vFade;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFade.x = transformed.y;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
         vFade.y = abs( dot( normalize( transformedNormal ), normalize( -mvPosition.xyz ) ) );`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vFade;")
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
         float fade = smoothstep( ${FADE_BOTTOM.toFixed(3)}, ${FADE_TOP.toFixed(3)}, vFade.x )
           * smoothstep( 0.0, ${EDGE_FADE.toFixed(2)}, vFade.y );
         gl_FragColor.rgb = mix( ${NYX_RGB}, gl_FragColor.rgb, fade );`,
      );
  };
  // Without this the patched program would collide with the unpatched shell.
  material.customProgramCacheKey = () => "owl-height-fade";
  return material;
}

/**
 * The owl, assembled from primitives: a lathed body, a lathed head whose
 * front is a shallow dish, and the brand mark's two eye rings, gold irises
 * and notched brow laid onto that dish.
 *
 * The shell is matte dark metal so the rim sweep reads as a sheen along an
 * edge, and the only bright things on it are the steel inlays and the gold
 * irises. The body dissolves into the background below the shoulders, so the
 * viewer gets a bust in the dark and never a full silhouette.
 *
 * It also watches you: the head turns to the pointer, the irises lead the
 * turn, the eyes warm as you come near and blink on their own. All of that
 * lives on the head's pivot rather than on the whole owl, because the body
 * holding still while the head tracks is what makes it read as a bird.
 *
 * Roughly 12k triangles, one generated 128px texture, and no post-processing:
 * the gleam comes from emissive irises and additive sprites, not a bloom pass.
 */
export default function ProceduralOwl({
  scrollProgress,
  gaze,
}: {
  scrollProgress: RefObject<number>;
  gaze: GazeRef;
}) {
  const headRef = useRef<Group>(null);
  const irisRefs = useRef<(Mesh | null)[]>([]);
  const glowRefs = useRef<(Sprite | null)[]>([]);
  const blink = useRef({ countdown: BLINK_GAP_MIN, closed: 0 });

  const bodyProfile = useMemo(createBodyProfile, []);
  const headProfile = useMemo(createHeadProfile, []);
  const faceProfile = useMemo(createFaceProfile, []);
  const eyeWellProfile = useMemo(createEyeWellProfile, []);
  const browCurve = useMemo(createBrowCurve, []);
  const glowTexture = useMemo(createGlowTexture, []);

  const materials = useMemo(
    () => ({
      // Matte dark metal rather than a polished shell: the rim sweep should
      // read as a soft sheen along an edge, not a highlight on plastic.
      shell: new MeshStandardMaterial({ color: "#0d1523", metalness: 0.5, roughness: 0.56 }),
      body: withHeightFade(
        new MeshStandardMaterial({ color: "#0d1523", metalness: 0.5, roughness: 0.56 }),
      ),
      // The facial disc: lighter and far less metallic than the skull, so it
      // takes the key light as a broad soft plane and separates from it.
      face: new MeshStandardMaterial({ color: "#1b2740", metalness: 0.18, roughness: 0.74 }),
      // Machined, not chromed. The irises have to stay the brightest thing
      // on the face, or the rings read as spectacles.
      steel: new MeshStandardMaterial({ color: "#7e93b0", metalness: 0.9, roughness: 0.44 }),
      steelDim: new MeshStandardMaterial({ color: "#5f789c", metalness: 0.88, roughness: 0.48 }),
      // The beak is a form, not an ornament: dark enough to stay a shadow on
      // the dish, with just enough sheen to catch the key light's edge.
      beak: new MeshStandardMaterial({ color: "#121b2c", metalness: 0.4, roughness: 0.58 }),
      // A near-black socket inside each ring, so the iris sits in a recess
      // instead of floating as a flat disc on the face.
      socket: new MeshStandardMaterial({ color: "#05080e", metalness: 0.1, roughness: 0.86 }),
      iris: new MeshStandardMaterial({
        color: "#e9b45c",
        metalness: 0.35,
        roughness: 0.26,
        emissive: new Color("#c8913c"),
        emissiveIntensity: IRIS_EMISSIVE,
        toneMapped: false,
      }),
    }),
    [],
  );

  const sprites = useMemo(
    () => ({
      iris: new SpriteMaterial({
        map: glowTexture,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: IRIS_GLOW_OPACITY,
        toneMapped: false,
      }),
      ambient: new SpriteMaterial({
        map: glowTexture,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: AMBIENT_GLOW_OPACITY,
        toneMapped: false,
      }),
    }),
    [glowTexture],
  );

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
      Object.values(sprites).forEach((material) => material.dispose());
      glowTexture.dispose();
    },
    [materials, sprites, glowTexture],
  );

  // Everything the owl does in response to you. All of it reads from refs and
  // writes to objects, so neither the pointer nor the scroll ever re-renders
  // React. The cost per frame is a handful of lerps.
  useFrame((state, delta) => {
    const progress = scrollProgress.current;
    const look = gaze.current;
    const step = Math.min(delta, 0.1);
    const damp = 1 - Math.exp(-TRACK_DAMP * step);

    // 1. The head follows the pointer, and drifts on its own when there is
    // nothing to follow. The idle yields as the gaze takes hold rather than
    // summing with it, or the owl wanders while it is meant to be staring.
    const head = headRef.current;
    if (head) {
      const reach = Math.min(1, Math.hypot(look.x, look.y));
      const idle = Math.sin(state.clock.elapsedTime * 0.15) * IDLE_YAW * (1 - reach);
      head.rotation.y += (idle + look.x * MAX_YAW - head.rotation.y) * damp;
      head.rotation.x += (look.y * MAX_PITCH - head.rotation.x) * damp;
      head.rotation.z += (-look.x * MAX_ROLL - head.rotation.z) * damp;
    }

    // 2. A blink, on a random gap. The lids are the wells themselves: the
    // iris flattens into its recess and its bloom goes with it, which in a
    // socket this dark reads as an eye closing rather than a sphere squashing.
    const lid = blink.current;
    lid.countdown -= step;
    if (lid.countdown <= -BLINK_DURATION) {
      lid.countdown = BLINK_GAP_MIN + Math.random() * BLINK_GAP_RANGE;
      lid.closed = 0;
    } else if (lid.countdown <= 0) {
      lid.closed = Math.sin((-lid.countdown / BLINK_DURATION) * Math.PI);
    }
    const closed = lid.closed;

    // 3. The irises lead the turn, and the eyes warm as you come near: the
    // owl noticing you, which is the whole reason it is on the page.
    const leadX = look.x * EYE_LEAD;
    const leadY = -look.y * EYE_LEAD * 0.65;
    irisRefs.current.forEach((iris, index) => {
      if (!iris) return;
      iris.position.x = EYE_POSITIONS[index] + leadX;
      iris.position.y = EYE_Y + leadY;
      iris.scale.set(1, 1 - closed * 0.93, 1);
    });
    glowRefs.current.forEach((glow, index) => {
      if (!glow) return;
      glow.position.x = EYE_POSITIONS[index] + leadX;
      glow.position.y = EYE_Y + leadY;
      glow.scale.set(EYE_GLOW_SCALE, EYE_GLOW_SCALE * (1 - closed * 0.85), 1);
    });

    // 4. And the gaze cools as the hero scrolls away, so the owl stops
    // competing with the copy below it.
    const warmth = (1 + look.attention * 0.45) * (1 - progress * 0.82);
    materials.iris.emissiveIntensity = IRIS_EMISSIVE * warmth * (1 - closed * 0.9);
    sprites.iris.opacity = IRIS_GLOW_OPACITY * warmth * (1 - closed);
    sprites.ambient.opacity = AMBIENT_GLOW_OPACITY * (1 - progress * 0.5);
  });

  return (
    <group>
      {/* Gleam, occluded by the owl so it reads as a halo. */}
      <sprite position={[0, HEAD_Y - 0.1, -1]} scale={[3.1, 3.1, 1]} material={sprites.ambient} />

      <mesh position={[0, BODY_DROP, 0]} scale={[1, 1, BODY_DEPTH_SCALE]} material={materials.body}>
        <latheGeometry args={[bodyProfile, 48]} />
      </mesh>

      {/* The neck. Three groups so the head turns about its own centre while
          every feature below keeps the coordinates the mark gave it: out to
          the head's axis, rotate there, and back. Rotating the outer group
          instead would swing the head through an arc and pull it off the
          reticle it is supposed to sit inside. */}
      <group position={[0, HEAD_Y, 0]}>
        <group ref={headRef}>
          <group position={[0, -HEAD_Y, 0]}>
            {/* Head is revolved about Z, so its front faces the camera. */}
            <mesh
              position={[0, HEAD_Y, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={materials.shell}
            >
              <latheGeometry args={[headProfile, 56]} />
            </mesh>

            <mesh
              position={[0, HEAD_Y, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={materials.face}
            >
              <latheGeometry args={[faceProfile, 56]} />
            </mesh>

            {/* A bezel along the crest of the dish, so the face reads as an
                instrument face set into a housing. */}
            <mesh position={[0, HEAD_Y, FACE_DEPTHS.bezel]} material={materials.steelDim}>
              <torusGeometry args={[FACE_RIM_RADIUS, 0.008, 8, 80]} />
            </mesh>

            {EYE_POSITIONS.map((x) => (
              <mesh
                key={`well${x}`}
                position={[x, EYE_Y, FACE_DEPTHS.eyeLip]}
                rotation={[Math.PI / 2, 0, 0]}
                material={materials.socket}
              >
                <latheGeometry args={[eyeWellProfile, 44]} />
              </mesh>
            ))}

            {/* A hairline bezel flush in the lip of each well: machining, not
                a frame. Anything thicker turns the pair into spectacles. */}
            {EYE_POSITIONS.map((x) => (
              <mesh
                key={`bezel${x}`}
                position={[x, EYE_Y, FACE_DEPTHS.eyeLip]}
                material={materials.steelDim}
              >
                <torusGeometry args={[EYE_WELL_RADIUS, 0.011, 8, 44]} />
              </mesh>
            ))}

            {EYE_POSITIONS.map((x, index) => (
              <mesh
                key={`iris${x}`}
                ref={(node) => {
                  irisRefs.current[index] = node;
                }}
                position={[x, EYE_Y, FACE_DEPTHS.iris]}
                material={materials.iris}
              >
                <sphereGeometry args={[IRIS_RADIUS, 18, 14]} />
              </mesh>
            ))}

            {EYE_POSITIONS.map((x, index) => (
              <sprite
                key={`glow${x}`}
                ref={(node) => {
                  glowRefs.current[index] = node;
                }}
                position={[x, EYE_Y, FACE_DEPTHS.eyeLip + 0.07]}
                scale={[EYE_GLOW_SCALE, EYE_GLOW_SCALE, 1]}
                material={sprites.iris}
              />
            ))}

            <mesh material={materials.steel}>
              <tubeGeometry args={[browCurve, 84, BROW_TUBE, 7, false]} />
            </mesh>
            {BROW_ENDS.map((position) => (
              <mesh key={position.join()} position={position} material={materials.steel}>
                <sphereGeometry args={[BROW_TUBE, 10, 8]} />
              </mesh>
            ))}

            <mesh
              position={[0, EYE_Y - 0.215, FACE_DEPTHS.beak]}
              rotation={[Math.PI, Math.PI / 4, 0]}
              material={materials.beak}
            >
              <coneGeometry args={[0.055, 0.185, 4]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
