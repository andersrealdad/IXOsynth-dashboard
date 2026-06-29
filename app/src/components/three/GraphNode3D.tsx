import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode } from '@/types/graph';

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

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80',
  building: '#FBBF24',
  failed: '#F87171',
  stale: '#9B99B8',
  planned: '#60A5FA',
};

const NODE_SIZES: Record<string, number> = {
  surface: 10,
  agent: 8,
  build_order: 6,
  notebook: 7,
  runbook: 5,
  article: 5,
  dataset: 6,
  devbook: 5,
};

function truncateLabel(label: string, maxLen: number) {
  return label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
}

interface GraphNode3DProps {
  node: GraphNode & { z?: number };
  isSelected: boolean;
  isConnected: boolean;
  hasSelection: boolean;
  onSelect: (node: GraphNode) => void;
  cameraDistance: number;
}

export default function GraphNode3D({
  node,
  isSelected,
  isConnected,
  hasSelection,
  onSelect,
  cameraDistance,
}: GraphNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const statusRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = GROUP_COLORS[node.group] || '#D4A853';
  const statusColor = STATUS_COLORS[node.status] || '#9B99B8';
  const baseSize = NODE_SIZES[node.kind] || 6;

  const opacity = useMemo(() => {
    if (!hasSelection) return 0.9;
    if (isSelected) return 1.0;
    if (isConnected) return 0.7;
    return 0.2;
  }, [hasSelection, isSelected, isConnected]);

  const emissiveIntensity = hovered ? 0.8 : isSelected ? 0.6 : 0.4;

  // Drift animation + selection pulse
  const driftOffset = useRef(Math.random() * Math.PI * 2);
  const basePos = useMemo(
    () => new THREE.Vector3(node.x, node.y, node.z ?? 0),
    [node.x, node.y, node.z]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const t = performance.now() / 1000;

    // Gentle drift
    const dx = Math.sin(t * 0.78 + driftOffset.current) * 0.3;
    const dy = Math.cos(t * 0.65 + driftOffset.current) * 0.3;
    const dz = Math.sin(t * 0.54 + driftOffset.current + 1) * 0.3;
    meshRef.current.position.set(basePos.x + dx, basePos.y + dy, basePos.z + dz);

    // Smooth scale transition
    const targetScale = isSelected
      ? 1.2 + Math.sin(t * 3) * 0.05 // pulsing when selected
      : hovered
        ? 1.3
        : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Status dot follow
    if (statusRef.current && meshRef.current) {
      statusRef.current.position.copy(meshRef.current.position);
      const pulse = node.status === 'active' ? 1 + Math.sin(t * 3) * 0.15 : 1;
      statusRef.current.scale.setScalar(pulse);
    }

    // Selection ring
    if (ringRef.current && meshRef.current) {
      ringRef.current.position.copy(meshRef.current.position);
      ringRef.current.rotation.z += delta * 0.5;
      const ringScale = isSelected ? 1.0 : 0.0001;
      ringRef.current.scale.lerp(new THREE.Vector3(ringScale, ringScale, ringScale), 0.15);
    }
  });

  const labelVisible = cameraDistance < 400;
  const labelOpacity = cameraDistance > 300 ? 1 - (cameraDistance - 300) / 100 : 1;

  return (
    <group>
      {/* Main node icosphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <icosahedronGeometry args={[baseSize * 0.4, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#D4A853' : color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Status indicator dot */}
      <mesh ref={statusRef} position={[basePos.x + baseSize * 0.35, basePos.y + baseSize * 0.35, basePos.z]}>
        <sphereGeometry args={[baseSize * 0.12, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Selection ring */}
      <mesh ref={ringRef} position={basePos} rotation={[0, 0, 0]} scale={0.0001}>
        <torusGeometry args={[baseSize * 0.55, 0.3, 8, 24]} />
        <meshBasicMaterial
          color="#D4A853"
          transparent
          opacity={isSelected ? 0.8 : 0}
        />
      </mesh>

      {/* Label HTML overlay */}
      {labelVisible && (
        <Html
          position={[basePos.x, basePos.y - baseSize * 0.7, basePos.z]}
          center
          style={{
            pointerEvents: 'none',
            opacity: labelOpacity,
            transition: 'opacity 200ms',
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: isSelected ? '#D4A853' : '#9B99B8',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              fontWeight: 500,
            }}
          >
            {truncateLabel(node.label, 15)}
          </div>
        </Html>
      )}
    </group>
  );
}
