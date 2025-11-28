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
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const animIdRef = useRef<number>(0);
  const prevMarkerRef = useRef<{ lat: number; lon: number } | null>(null);

  // Utility: Convert lat/lon to 3D position on sphere
  const latLonToVector3 = (lat: number, lon: number, radius: number = 1.2) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  };

  // Create marker group at specified location
  const createMarker = (lat: number, lon: number, scene: THREE.Scene) => {
    // Remove old marker if exists
    if (markerGroupRef.current) {
      scene.remove(markerGroupRef.current);
    }

    const markerGroup = new THREE.Group();
    markerGroupRef.current = markerGroup;

    // Position on sphere surface
    const pos = latLonToVector3(lat, lon, 1.2);
    markerGroup.position.copy(pos);

    // Point toward center (normal of sphere at that point)
    const normalDirection = new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    markerGroup.lookAt(pos.clone().add(normalDirection));

    // Main pin (cone shape)
    const pinGeometry = new THREE.ConeGeometry(0.08, 0.3, 16);
    const pinMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF1744,
      emissive: 0xFF1744,
      emissiveIntensity: 0.8,
      shininess: 100,
      flatShading: false
    });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.z = 0.15;
    pin.castShadow = true;
    markerGroup.add(pin);

    // Glow ring around pin
    const ringGeometry = new THREE.TorusGeometry(0.15, 0.03, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00C2FF,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.z = 0.1;
    ring.rotation.x = Math.PI / 2;
    markerGroup.add(ring);

    // Pulsing halo sphere
    const haloGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF1744,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.name = 'halo-pulse';
    markerGroup.add(halo);

    // Light source at marker
    const pointLight = new THREE.PointLight(0xFF1744, 1.5, 5);
    pointLight.position.z = 0.2;
    markerGroup.add(pointLight);

    scene.add(markerGroup);

    return markerGroup;
  };

  // Update camera to focus on marker
  const focusOnMarker = (lat: number, lon: number, camera: THREE.PerspectiveCamera, zoomLevel: number) => {
    const pos = latLonToVector3(lat, lon, 1.2);
    const direction = pos.normalize();
    
    // Position camera away from marker
    const cameraDistance = zoomLevel;
    const newCameraPos = direction.multiplyScalar(cameraDistance);
    
    camera.position.lerp(newCameraPos, 0.05); // Smooth transition
    camera.lookAt(0, 0, 0);
  };

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

  // Handle marker position changes
  useEffect(() => {
    if (sceneRef.current && showMarker && markerPosition) {
      // Only update marker if position actually changed
      if (!prevMarkerRef.current || 
          prevMarkerRef.current.lat !== markerPosition.lat || 
          prevMarkerRef.current.lon !== markerPosition.lon) {
        createMarker(markerPosition.lat, markerPosition.lon, sceneRef.current);
        prevMarkerRef.current = markerPosition;

        // Focus camera on marker
        if (rendererRef.current) {
          const camera = (sceneRef.current as any).__camera;
          if (camera) {
            focusOnMarker(markerPosition.lat, markerPosition.lon, camera, zoomLevel || 2.5);
          }
        }
      }
    } else if (!showMarker && markerGroupRef.current && sceneRef.current) {
      // Remove marker if showMarker is false
      sceneRef.current.remove(markerGroupRef.current);
      markerGroupRef.current = null;
      prevMarkerRef.current = null;
    }
  }, [showMarker, markerPosition, zoomLevel]);

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
      (scene as any).__camera = camera; // Store camera reference

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
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowShadowMap;

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
      earth.castShadow = true;
      earth.receiveShadow = true;
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
      dirLight.castShadow = true;
      scene.add(dirLight);

      // Store time for animations
      let time = 0;

      // Animation loop
      const animate = () => {
        animIdRef.current = requestAnimationFrame(animate);
        time += 0.016; // ~60fps
        
        earth.rotation.y += 0.002;

        // Animate halo pulse
        const halo = markerGroupRef.current?.getObjectByName('halo-pulse');
        if (halo) {
          const scale = 1 + Math.sin(time * 2) * 0.3;
          halo.scale.set(scale, scale, scale);
        }

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
