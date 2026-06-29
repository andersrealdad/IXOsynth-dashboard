import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853',
  2: '#5B8DB8',
  3: '#8B6F9B',
  4: '#6BA87C',
  5: '#C97A5B',
  6: '#6B8FC4',
  7: '#A89060',
  8: '#C4A040',
  9: '#7A8B9A',
};

interface GraphEdge3DProps {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  group: number;
  isActive: boolean;
  isDimmed: boolean;
  kind: string;
}

export default function GraphEdge3D({
  fromPos,
  toPos,
  group,
  isActive,
  isDimmed,
}: GraphEdge3DProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const particle1Ref = useRef<THREE.Mesh>(null);
  const particle2Ref = useRef<THREE.Mesh>(null);
  const particle3Ref = useRef<THREE.Mesh>(null);

  const color = GROUP_COLORS[group] || '#D4A853';
  const goldColor = '#D4A853';

  // Create curved path with midpoint elevated on Y
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...fromPos);
    const end = new THREE.Vector3(...toPos);
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y += 8; // arc height
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [fromPos, toPos]);

  // Tube geometry along curve
  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, 0.3, 8, false);
  }, [curve]);

  const opacity = isDimmed ? 0.1 : isActive ? 0.8 : 0.4;
  const emissiveInt = isActive ? 0.5 : 0.2;

  // Particle positions along curve
  const particleOffsets = useMemo(() => [0, 0.33, 0.66], []);
  const particleSpeed = 0.15; // units per second along curve

  useFrame(() => {
    const t = performance.now() / 1000;

    // Animate particles along curve
    const refs = [particle1Ref, particle2Ref, particle3Ref];
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const progress =
        ((t * particleSpeed + particleOffsets[i]) % 1);
      const pos = curve.getPointAt(progress);
      ref.current.position.copy(pos);

      // Fade in/out near endpoints
      const fadeStart = 0.1;
      const fadeEnd = 0.9;
      let particleOpacity = 1;
      if (progress < fadeStart) {
        particleOpacity = progress / fadeStart;
      } else if (progress > fadeEnd) {
        particleOpacity = (1 - progress) / (1 - fadeEnd);
      }
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = particleOpacity * (isDimmed ? 0.1 : isActive ? 1 : 0.6);
      mat.transparent = true;
    });

    // Scale tube when active
    if (tubeRef.current) {
      const targetScale = isActive ? 1.5 : 1.0;
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity || opacity, opacity, 0.1);
      tubeRef.current.scale.setScalar(
        THREE.MathUtils.lerp(tubeRef.current.scale.x, targetScale, 0.1)
      );
    }
  });

  return (
    <group>
      {/* Tube */}
      <mesh ref={tubeRef} geometry={tubeGeo} scale={1}>
        <meshStandardMaterial
          color={color}
          emissive={isActive ? goldColor : color}
          emissiveIntensity={emissiveInt}
          transparent
          opacity={opacity}
          roughness={0.4}
          metalness={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Flow particles */}
      <mesh ref={particle1Ref}>
        <sphereGeometry args={[0.8, 6, 6]} />
        <meshStandardMaterial
          color={goldColor}
          emissive={goldColor}
          emissiveIntensity={1}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={particle2Ref}>
        <sphereGeometry args={[0.8, 6, 6]} />
        <meshStandardMaterial
          color={goldColor}
          emissive={goldColor}
          emissiveIntensity={1}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={particle3Ref}>
        <sphereGeometry args={[0.8, 6, 6]} />
        <meshStandardMaterial
          color={goldColor}
          emissive={goldColor}
          emissiveIntensity={1}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
