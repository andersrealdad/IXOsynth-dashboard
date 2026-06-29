import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { GraphData, GraphNode, GraphEdge } from '@/types/graph';
import GraphNode3D from './GraphNode3D';
import GraphEdge3D from './GraphEdge3D';

interface SimNode extends GraphNode {
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  x: number;
  y: number;
}

interface SimEdge {
  source: string | SimNode;
  target: string | SimNode;
  kind: string;
}

// Z-offset per group for depth distribution
const GROUP_Z: Record<number, number> = {
  1: 5,
  2: -5,
  3: 10,
  4: -10,
  5: 15,
  6: -15,
  7: 0,
  8: 8,
  9: 20,
};

interface Scene3DProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  cameraTarget: THREE.Vector3 | null;
  onCameraMove: (pos: THREE.Vector3) => void;
}

export default function Scene3D({
  graphData,
  selectedNode,
  setSelectedNode,
  cameraTarget,
  onCameraMove,
}: Scene3DProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [simulatedNodes, setSimulatedNodes] = useState<SimNode[]>([]);
  const cameraPosRef = useRef(new THREE.Vector3(0, 0, 400));

  // Normalize node positions to center around origin and add Z
  const normalizedNodes = useMemo<SimNode[]>(() => {
    const nodes = graphData.nodes;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = 0.3; // scale down from 2D canvas coords to 3D world

    return nodes.map((n) => {
      const baseZ = GROUP_Z[n.group] || 0;
      const jitter = (Math.random() - 0.5) * 4;
      return {
        ...n,
        x: (n.x - cx) * scale,
        y: (n.y - cy) * scale,
        z: baseZ + jitter,
      };
    });
  }, [graphData.nodes]);

  const simEdges = useMemo<SimEdge[]>(() => {
    return graphData.edges.map((e) => ({
      source: e.from,
      target: e.to,
      kind: e.kind,
    }));
  }, [graphData.edges]);

  // Run D3 force simulation
  useEffect(() => {
    const sim = forceSimulation<SimNode>(normalizedNodes)
      .force('charge', forceManyBody().strength(-200))
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d: SimNode) => d.id)
          .distance(100)
      )
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<SimNode>().radius(15))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    // Run initial ticks synchronously for layout
    for (let i = 0; i < 300; i++) {
      sim.tick();
    }

    setSimulatedNodes([...normalizedNodes]);

    // Continue simulation at low alpha
    sim.on('tick', () => {
      setSimulatedNodes([...normalizedNodes]);
    });

    return () => {
      sim.stop();
    };
  }, [normalizedNodes, simEdges]);

  // Build node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    simulatedNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [simulatedNodes]);

  // Build edge data with resolved positions
  const resolvedEdges = useMemo(() => {
    return graphData.edges
      .map((e) => {
        const fromNode = nodeMap.get(e.from);
        const toNode = nodeMap.get(e.to);
        if (!fromNode || !toNode) return null;
        return {
          ...e,
          fromPos: [fromNode.x, fromNode.y, fromNode.z ?? 0] as [number, number, number],
          toPos: [toNode.x, toNode.y, toNode.z ?? 0] as [number, number, number],
          fromGroup: fromNode.group,
        };
      })
      .filter(Boolean) as (GraphEdge & {
        fromPos: [number, number, number];
        toPos: [number, number, number];
        fromGroup: number;
      })[];
  }, [graphData.edges, nodeMap]);

  // Compute which nodes are connected to the selected node
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>();
    resolvedEdges.forEach((e) => {
      if (e.from === selectedNode.id) connected.add(e.to);
      if (e.to === selectedNode.id) connected.add(e.from);
    });
    return connected;
  }, [selectedNode, resolvedEdges]);

  // Camera animation via useFrame
  useFrame(() => {
    // Smooth camera transition
    if (cameraTarget) {
      cameraPosRef.current.lerp(cameraTarget, 0.05);
      camera.position.copy(cameraPosRef.current);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      }
    }

    // Report camera distance for label LOD
    onCameraMove(camera.position);
  });

  return (
    <>
      {/* Fog */}
      <fogExp2 attach="fog" args={['#131428', 0.02]} />

      {/* Lighting */}
      <ambientLight color="#4A4B82" intensity={0.3} />
      <pointLight position={[0, 0, 0]} color="#D4A853" intensity={0.4} distance={200} decay={2} />
      <directionalLight position={[-1, 1, 0.5]} color="#E8E6F0" intensity={0.2} />

      {/* Stars background */}
      <Stars radius={400} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

      {/* Grid floor */}
      <gridHelper
        args={[400, 40, '#3A3B6E', '#3A3B6E']}
        position={[0, -60, 0]}
      />

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={50}
        maxDistance={1000}
        dampingFactor={0.08}
        enableDamping
      />

      {/* Nodes */}
      {simulatedNodes.map((node) => (
        <GraphNode3D
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          isConnected={connectedNodeIds.has(node.id)}
          hasSelection={selectedNode !== null}
          onSelect={setSelectedNode}
          cameraDistance={camera.position.distanceTo(
            new THREE.Vector3(node.x, node.y, node.z ?? 0)
          )}
        />
      ))}

      {/* Edges */}
      {resolvedEdges.map((edge, i) => {
        const isConnectedToSelected = selectedNode
          ? edge.from === selectedNode.id || edge.to === selectedNode.id
          : false;
        const isDimmed = selectedNode !== null && !isConnectedToSelected;
        return (
          <GraphEdge3D
            key={`${edge.from}-${edge.to}-${i}`}
            fromPos={edge.fromPos}
            toPos={edge.toPos}
            group={edge.fromGroup}
            isActive={isConnectedToSelected}
            isDimmed={isDimmed}
            kind={edge.kind}
          />
        );
      })}
    </>
  );
}
