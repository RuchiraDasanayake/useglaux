import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";
import { OWL_HEIGHT } from "./owlGeometry";

/**
 * The drop-in slot for an authored owl. Dormant unless VITE_OWL_MODEL_URL is
 * set, so a normal load never requests a model or a decoder.
 *
 * Meshopt decoding is bundled with drei. Draco is deliberately disabled so
 * this optional path never reaches out to a third-party decoder CDN.
 *
 * The model is auto-centred and scaled to the procedural owl's height, so
 * the hero framing holds for any source asset without further tuning.
 */
export default function OwlModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, false, true);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const bounds = new Box3().setFromObject(root);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = OWL_HEIGHT / Math.max(size.y, 1e-3);

    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const wrapper = new Group();
    wrapper.add(root);
    return wrapper;
  }, [scene]);

  return <primitive object={model} />;
}
