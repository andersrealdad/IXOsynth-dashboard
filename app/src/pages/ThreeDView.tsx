import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader2, Compass, RotateCw, Grid3X3, Maximize2 } from 'lucide-react';
import * as THREE from 'three';
import { useData } from '@/hooks/useData';
import { useAppStore } from '@/store/useAppStore';
import Scene3D from '@/components/three/Scene3D';

type CameraPreset = 'top' | 'front' | 'side' | 'isometric' | 'overview';

const PRESET_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  top: [0, 0, 120],
  front: [0, 0, 400],
  side: [300, 0, 0],
  isometric: [60, 60, 60],
  overview: [0, 80, 0],
};

export default function ThreeDView() {
  const { data: graphData, loading } = useData('graph');
  const selectedNode = useAppStore((s) => s.selectedNode);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);

  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [, setCameraPos] = useState(new THREE.Vector3(0, 0, 400));
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showPresets, setShowPresets] = useState(false);

  // Entrance animation: start from front view
  useEffect(() => {
    if (!loading && graphData) {
      setCameraTarget(new THREE.Vector3(0, 0, 400));
    }
  }, [loading, graphData]);

  const handlePreset = useCallback((preset: CameraPreset) => {
    const pos = PRESET_POSITIONS[preset];
    setCameraTarget(new THREE.Vector3(...pos));
    setShowPresets(false);
  }, []);

  const handleCameraMove = useCallback((pos: THREE.Vector3) => {
    setCameraPos(pos.clone());
  }, []);

  const handleReset = useCallback(() => {
    setCameraTarget(new THREE.Vector3(0, 0, 400));
  }, []);

  if (loading || !graphData) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{ background: '#131428' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
          <span
            className="font-mono text-sm"
            style={{ color: '#9B99B8' }}
          >
            Loading 3D graph...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#131428' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 1000,
          position: [0, 0, 400],
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ background: '#131428' }}
      >
        <Scene3D
          graphData={graphData}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          cameraTarget={cameraTarget}
          onCameraMove={handleCameraMove}
        />
      </Canvas>

      {/* Floating camera preset controls */}
      <div
        className="absolute bottom-6 right-6 flex flex-col gap-2"
        style={{ zIndex: 10 }}
      >
        {/* Preset buttons dropdown */}
        {showPresets && (
          <div
            className="flex flex-col gap-1 mb-1"
            style={{
              background: 'rgba(26, 27, 58, 0.92)',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid rgba(74, 75, 130, 0.4)',
            }}
          >
            {([
              ['front', 'Front'],
              ['top', 'Top'],
              ['side', 'Side'],
              ['isometric', 'Isometric'],
              ['overview', 'Overview'],
            ] as [CameraPreset, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className="px-3 py-2 text-left font-mono text-xs transition-colors"
                style={{
                  color: '#9B99B8',
                  borderRadius: '4px',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#2E2F5A';
                  (e.target as HTMLButtonElement).style.color = '#E8E6F0';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'transparent';
                  (e.target as HTMLButtonElement).style.color = '#9B99B8';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div
          className="flex flex-col gap-1"
          style={{
            background: 'rgba(26, 27, 58, 0.92)',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid rgba(74, 75, 130, 0.4)',
          }}
        >
          {/* Camera presets toggle */}
          <button
            onClick={() => setShowPresets((p) => !p)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              color: showPresets ? '#D4A853' : '#9B99B8',
              background: showPresets ? 'rgba(212, 168, 83, 0.15)' : 'transparent',
            }}
            title="Camera presets"
          >
            <Compass size={18} />
          </button>

          {/* Auto-rotate toggle */}
          <button
            onClick={() => setAutoRotate((r) => !r)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              color: autoRotate ? '#D4A853' : '#9B99B8',
              background: autoRotate ? 'rgba(212, 168, 83, 0.15)' : 'transparent',
            }}
            title="Auto-rotate"
          >
            <RotateCw size={18} />
          </button>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid((g) => !g)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              color: showGrid ? '#D4A853' : '#9B99B8',
              background: showGrid ? 'rgba(212, 168, 83, 0.15)' : 'transparent',
            }}
            title="Toggle grid"
          >
            <Grid3X3 size={18} />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              color: '#9B99B8',
              background: 'transparent',
            }}
            title="Reset camera"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Node info overlay */}
      {selectedNode && (
        <div
          className="absolute top-4 left-4 font-mono text-xs"
          style={{
            background: 'rgba(26, 27, 58, 0.92)',
            borderRadius: '8px',
            padding: '12px 16px',
            border: '1px solid rgba(74, 75, 130, 0.4)',
            color: '#E8E6F0',
            maxWidth: '280px',
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  GROUP_COLORS[selectedNode.group] || '#D4A853',
              }}
            />
            <span className="font-semibold" style={{ color: '#D4A853' }}>
              {selectedNode.label}
            </span>
          </div>
          <div style={{ color: '#9B99B8' }}>Kind: {selectedNode.kind}</div>
          <div style={{ color: '#9B99B8' }}>Status: {selectedNode.status}</div>
          <div style={{ color: '#9B99B8' }}>Group: {selectedNode.group}</div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 font-mono text-xs transition-colors"
            style={{
              color: '#6B6988',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.color = '#E8E6F0';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.color = '#6B6988';
            }}
          >
            Click to deselect
          </button>
        </div>
      )}

      {/* View label */}
      <div
        className="absolute top-4 right-4 font-mono text-xs px-3 py-1"
        style={{
          background: 'rgba(26, 27, 58, 0.92)',
          borderRadius: '4px',
          color: '#6B6988',
          border: '1px solid rgba(74, 75, 130, 0.4)',
          zIndex: 10,
        }}
      >
        3D View &mdash; {graphData.nodes.length} nodes / {graphData.edges.length} edges
      </div>
    </div>
  );
}

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
