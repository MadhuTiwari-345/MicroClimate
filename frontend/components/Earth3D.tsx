
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Earth3DProps {
  viewMode?: 'intro' | 'landing' | 'dashboard' | 'explore';
  showMarker?: boolean;
  markerPosition?: { lat: number; lon: number } | null;
  zoomLevel?: number;
  onLocationClick?: (lat: number, lon: number) => void;
}

export const Earth3D: React.FC<Earth3DProps> = ({ 
  viewMode = 'landing', 
  showMarker = false, 
  markerPosition, 
  zoomLevel = 2.5,
  onLocationClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);

  // Handle Position shifts based on view mode
  useEffect(() => {
    if (earthGroupRef.current) {
      // Shift Earth to the right in Dashboard/Explore mode to clear the sidebar
      // Explore might need slightly different offset depending on sidebar width
      const targetX = (viewMode === 'dashboard' || viewMode === 'explore') ? 0.6 : 0; 
      earthGroupRef.current.userData.targetX = targetX;
    }
    
    if (markerGroupRef.current) {
        markerGroupRef.current.visible = (viewMode === 'dashboard' || viewMode === 'explore') && showMarker;
    }
  }, [viewMode, showMarker]);

  // Handle Marker Position Update
  useEffect(() => {
    if (markerGroupRef.current && markerPosition) {
        const { lat, lon } = markerPosition;
        
        const r = 1.0; 
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = -(r * Math.sin(phi) * Math.cos(theta));
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        
        const pinGroup = markerGroupRef.current.children[0]; 
        const ring = markerGroupRef.current.children[1];

        if (pinGroup && ring) {
             pinGroup.position.set(x, y, z);
             pinGroup.lookAt(new THREE.Vector3(0,0,0)); 
             pinGroup.rotateX(Math.PI / 2);

             ring.position.set(x,y,z);
             ring.lookAt(new THREE.Vector3(0,0,0));
        }
    }
  }, [markerPosition]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = zoomLevel; 
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add cursor style for interactivity
    renderer.domElement.style.cursor = 'grab';
    
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Groups
    // earthGroup handles Position (Dashboard Shift)
    const earthGroup = new THREE.Group();
    earthGroup.userData = { targetX: 0 }; 
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // rotationGroup handles Rotation (Spin + Tilt + User Drag)
    const rotationGroup = new THREE.Group();
    rotationGroup.rotation.z = 10 * Math.PI / 180; // Initial Tilt
    earthGroup.add(rotationGroup);
    rotationGroupRef.current = rotationGroup;

    // Textures
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const bumpMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
    
    // Earth Geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.02,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });
    
    const earthMesh = new THREE.Mesh(geometry, material);
    rotationGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmosphere Glow
    const atmosphereGeo = new THREE.SphereGeometry(1.03, 64, 64);
    const atmosphereMat = new THREE.MeshPhongMaterial({
        color: 0x00C2FF,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    rotationGroup.add(atmosphere);

    // --- Marker Group (Inside Rotation Group so it spins with earth) ---
    const markerGroup = new THREE.Group();
    markerGroup.visible = (viewMode === 'dashboard' || viewMode === 'explore') && showMarker;
    rotationGroup.add(markerGroup);
    markerGroupRef.current = markerGroup;

    // Pin
    const pinGroup = new THREE.Group();
    const pinHeadGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const pinHeadMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
    pinHead.position.y = 0.05;
    pinGroup.add(pinHead);

    const pinStickGeo = new THREE.CylinderGeometry(0.005, 0.002, 0.05, 8);
    const pinStickMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pinStick = new THREE.Mesh(pinStickGeo, pinStickMat);
    pinStick.position.y = 0.025;
    pinGroup.add(pinStick);
    
    // Glow
    const glowGeo = new THREE.PlaneGeometry(0.1, 0.1);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        const g = ctx.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0, 'rgba(255,0,68,1)');
        g.addColorStop(1, 'rgba(255,0,68,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,64,64);
    }
    glowMat.map = new THREE.CanvasTexture(canvas);
    
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotateX(-Math.PI/2); 
    pinGroup.add(glow);
    markerGroup.add(pinGroup);
    
    // Pulse Ring
    const ringGeo = new THREE.RingGeometry(0.04, 0.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    markerGroup.add(ring);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.SpotLight(0x00C2FF, 5);
    rimLight.position.set(-5, 1, 5);
    rimLight.lookAt(new THREE.Vector3(0,0,0));
    scene.add(rimLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 25;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- Interaction (Drag to Rotate) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let isClick = true;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return; // Left click only
        isDragging = true;
        isClick = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        if (rendererRef.current) rendererRef.current.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        if (Math.abs(deltaMove.x) > 2 || Math.abs(deltaMove.y) > 2) {
            isClick = false;
        }

        if (rotationGroupRef.current) {
            const rotationSpeed = 0.005;
            // Rotate Y (horizontal drag)
            rotationGroupRef.current.rotation.y += deltaMove.x * rotationSpeed;
            
            // Rotate X (vertical drag) - CLAMPED to prevent flipping
            const newX = rotationGroupRef.current.rotation.x + deltaMove.y * rotationSpeed;
            const limit = Math.PI / 3; // 60 degrees
            rotationGroupRef.current.rotation.x = Math.max(-limit, Math.min(limit, newX));
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
        isDragging = false;
        if (rendererRef.current) rendererRef.current.domElement.style.cursor = 'grab';
        if (isClick) {
            handleEarthClick(e);
        }
    };

    const handleEarthClick = (event: PointerEvent) => {
        if (!onLocationClick || !earthMeshRef.current || !cameraRef.current) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObject(earthMeshRef.current);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            // Convert world point to local point relative to earth mesh
            const localPoint = earthMeshRef.current.worldToLocal(point.clone());
            localPoint.normalize();
            
            const phi = Math.acos(localPoint.y);
            const lat = 90 - (phi * 180 / Math.PI);
            
            const theta = Math.atan2(localPoint.z, -localPoint.x);
            let lon = (theta * 180 / Math.PI) - 180;
            
            if (lon < -180) lon += 360;
            if (lon > 180) lon -= 360;

            onLocationClick(lat, lon);
        }
    };

    // Zoom via Wheel
    const onWheel = (e: WheelEvent) => {
        if (cameraRef.current) {
            const zoomSpeed = 0.001;
            const newZ = cameraRef.current.position.z + e.deltaY * zoomSpeed;
            // Clamp zoom
            cameraRef.current.position.z = Math.max(1.2, Math.min(5.0, newZ));
        }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    renderer.domElement.addEventListener('pointerleave', () => {
        isDragging = false;
        if(rendererRef.current) rendererRef.current.domElement.style.cursor = 'grab';
    });

    // Animation
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Auto-rotate if not dragging (slow spin)
      if (rotationGroup && !isDragging) {
          rotationGroup.rotation.y += 0.0005;
      }
      
      stars.rotation.y -= 0.0001;

      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
      ring.scale.set(scale, scale, scale);
      ringMat.opacity = 0.5 - Math.sin(Date.now() * 0.003) * 0.3;

      if (earthGroup.userData.targetX !== undefined) {
         earthGroup.position.x += (earthGroup.userData.targetX - earthGroup.position.x) * 0.05;
      }
      
      if (Math.abs(camera.position.z - zoomLevel) > 0.01) {
          camera.position.z += (zoomLevel - camera.position.z) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
          rendererRef.current.domElement.removeEventListener('pointerdown', onPointerDown);
          rendererRef.current.domElement.removeEventListener('pointermove', onPointerMove);
          rendererRef.current.domElement.removeEventListener('pointerup', onPointerUp);
          rendererRef.current.domElement.removeEventListener('wheel', onWheel);
          rendererRef.current.domElement.removeEventListener('pointerleave', () => {});
      }
      cancelAnimationFrame(frameId);
      if(mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [viewMode, showMarker, zoomLevel, onLocationClick]);

  return <div ref={mountRef} className="fixed inset-0 z-0 bg-[#050505]" />;
};
