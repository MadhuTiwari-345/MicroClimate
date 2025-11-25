import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Earth3DProps {
  viewMode?: 'intro' | 'landing' | 'dashboard' | 'explore';
  showMarker?: boolean;
  markerPosition?: { lat: number; lon: number } | null;
  zoomLevel?: number;
  onLocationClick?: (lat: number, lon: number) => void;
  reduceEffects?: boolean;
}

export const Earth3D: React.FC<Earth3DProps> = ({ 
  viewMode = 'landing', 
  showMarker = false, 
  markerPosition, 
  zoomLevel = 2.5,
  onLocationClick,
  reduceEffects = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    // Ensure DOM is ready before initializing
    const timer = setTimeout(() => {
      if (containerRef.current) {
        initEarth();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupEarth();
    };
  }, []);

  const initEarth = () => {
    if (!containerRef.current) return;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 2.5;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        precision: 'highp'
      });

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x050505, 0);
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      rendererRef.current = renderer;

      // Clear and add renderer
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);

      // Procedural texture fallback
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = 2048;
      textureCanvas.height = 1024;
      const ctx = textureCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a4d7a';
        ctx.fillRect(0, 0, 2048, 1024);
        ctx.fillStyle = '#2d5a3d';
        ctx.fillRect(100, 200, 300, 250);
        ctx.fillRect(150, 500, 150, 200);
        ctx.fillRect(900, 150, 400, 450);
        ctx.fillRect(1300, 100, 500, 400);
        ctx.fillRect(1600, 650, 150, 120);
      }

      const canvasTexture = new THREE.CanvasTexture(textureCanvas);

      // Earth
      const geometry = new THREE.SphereGeometry(1.2, 64, 64);
      const material = new THREE.MeshPhongMaterial({
        map: canvasTexture,
        specular: new THREE.Color(0x333333),
        shininess: 15,
      });

      const earth = new THREE.Mesh(geometry, material);
      scene.add(earth);
      earthRef.current = earth;

      // Try to load remote texture
      const loader = new THREE.TextureLoader();
      loader.load(
        'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        (texture) => {
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        () => {
          // Use fallback - already set
        }
      );

      // Atmosphere
      const atmoGeo = new THREE.SphereGeometry(1.25, 64, 64);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x00C2FF,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      scene.add(new THREE.Mesh(atmoGeo, atmoMat));

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);

      // Animation loop
      const animate = () => {
        animIdRef.current = requestAnimationFrame(animate);
        earth.rotation.y += 0.002;
        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Store cleanup function
      (window as any).__earthCleanup = () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animIdRef.current);
        try {
          if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
          }
        } catch (e) {}
        geometry.dispose();
        material.dispose();
        atmoMat.dispose();
        atmoGeo.dispose();
        canvasTexture.dispose();
        renderer.dispose();
      };

    } catch (error) {
      console.error('Earth3D init failed:', error);
    }
  };

  const cleanupEarth = () => {
    if ((window as any).__earthCleanup) {
      (window as any).__earthCleanup();
      delete (window as any).__earthCleanup;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: '#050505'
      }}
      aria-hidden="true"
    />
  );
};
