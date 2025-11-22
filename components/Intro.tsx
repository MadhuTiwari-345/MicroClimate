import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Search, HelpCircle, Layers, BarChart3, ShieldCheck, Check } from 'lucide-react';
import * as THREE from 'three';

// --- Mini 3D Earth Component for Tutorial Banner ---
const TutorialEarth: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup dimensions
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    // Use a wider FOV or position closer to get the "cropped" look if needed, 
    // but standard perspective is usually fine.
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.5; // Move back slightly to see more of the globe in the wide banner

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Earth Mesh
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const geometry = new THREE.SphereGeometry(1.2, 64, 64); // Slightly larger sphere
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Atmosphere Glow
    const atmoGeo = new THREE.SphereGeometry(1.25, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x00C2FF,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmosphere);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      earth.rotation.y += 0.002; // Slow rotation
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
        if (!mountRef.current) return;
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};


interface IntroProps {
  onFinish: () => void;
}

export const Intro: React.FC<IntroProps> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const steps = [
    {
      id: 1,
      title: "Find any location to analyze its microclimate.",
      subtitle: "Type a city, address, or coordinates to begin.",
      // Step 1 renders the Search Bar overlay specifically
      renderContent: () => (
        <>
           {/* Text Overlay */}
           <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-20 max-w-md">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Find any location to analyze its microclimate.
              </h2>
              <p className="text-gray-200 text-lg drop-shadow-md mb-6">
                Type a city, address, or coordinates to begin.
              </p>
              
              {/* Mock Search Bar */}
              <div className="relative w-full max-w-sm bg-[#161B26]/80 backdrop-blur-md border border-white/30 rounded-full flex items-center px-4 py-3 shadow-2xl">
                  <Search className="w-5 h-5 text-gray-300 mr-3" />
                  <div className="w-2 h-5 bg-[#00C2FF] animate-pulse mr-1"></div>
                  <span className="text-gray-400 text-sm">Search...</span>
                  <div className="absolute right-3 p-1.5 bg-white/10 rounded-full">
                     <Search className="w-3 h-3 text-white" />
                  </div>
              </div>
           </div>
        </>
      )
    },
    {
      id: 2,
      title: "Explore detailed layers",
      subtitle: "View temperature, wind, and humidity.",
      renderContent: () => (
        <div className="absolute inset-0 flex items-center justify-center z-20">
           <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-[#00C2FF]/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-[#00C2FF]/50 mb-6 shadow-[0_0_30px_rgba(0,194,255,0.3)]">
                   <Layers className="w-10 h-10 text-[#00C2FF]" />
               </div>
               <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Explore detailed layers</h2>
               <p className="text-gray-200 text-lg drop-shadow-md">View temperature, wind, and humidity.</p>
           </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Real-time Visualization",
      subtitle: "Watch weather patterns unfold live.",
      renderContent: () => (
         <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#00C2FF]/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-[#00C2FF]/50 mb-6 shadow-[0_0_30px_rgba(0,194,255,0.3)]">
                    <BarChart3 className="w-10 h-10 text-[#00C2FF]" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Real-time Visualization</h2>
                <p className="text-gray-200 text-lg drop-shadow-md">Watch weather patterns unfold live.</p>
            </div>
         </div>
      )
    },
    {
        id: 4,
        title: "Safety First",
        subtitle: "Get instant safety scores for any region.",
        renderContent: () => (
           <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-[#00C2FF]/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-[#00C2FF]/50 mb-6 shadow-[0_0_30px_rgba(0,194,255,0.3)]">
                      <ShieldCheck className="w-10 h-10 text-[#00C2FF]" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Safety First</h2>
                  <p className="text-gray-200 text-lg drop-shadow-md">Get instant safety scores for any region.</p>
              </div>
           </div>
        )
      }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>

      {/* Main Card Container */}
      <div className="relative w-full max-w-4xl bg-[#0B0E14] border border-[#1E2330] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        
        {/* Hero / Graphic Section (Top ~60-70% height) */}
        <div className="relative w-full h-[320px] overflow-hidden bg-gradient-to-b from-[#050505] to-[#0B0E14] border-b border-white/10">
            
            {/* 3D Earth Background */}
            <div className="absolute inset-0 z-0 opacity-80">
                <TutorialEarth />
            </div>

            {/* Vignette Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40 z-10 pointer-events-none"></div>
            
            {/* Step Specific Content Overlay */}
            {currentStep.renderContent()}
        </div>

        {/* Footer / Controls Section */}
        <div className="p-6 bg-[#0B0E14]">
            
            {/* Row 1: Help Icon & Step Counter */}
            <div className="flex items-center justify-between mb-4 text-gray-400">
                <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                <span className="text-sm font-medium font-mono">{step}/{totalSteps}</span>
            </div>

            {/* Row 2: Progress Bar */}
            <div className="w-full h-2 bg-[#1E2330] rounded-full mb-8 overflow-hidden">
                <div 
                    className="h-full bg-[#00C2FF] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,194,255,0.5)]"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
            </div>

            {/* Row 3: Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <button 
                    onClick={onFinish}
                    className="text-sm font-semibold text-white hover:text-[#00C2FF] transition-colors order-2 sm:order-1"
                >
                    Skip Tutorial
                </button>

                <div className="flex items-center space-x-2 order-3 sm:order-2 cursor-pointer group" onClick={() => setDontShowAgain(!dontShowAgain)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-[#00C2FF] border-[#00C2FF]' : 'border-gray-500 bg-transparent group-hover:border-gray-400'}`}>
                        {dontShowAgain && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 select-none">Don’t show again</span>
                </div>

                <button 
                    onClick={handleNext}
                    className="order-1 sm:order-3 flex items-center px-6 py-2.5 bg-[#00C2FF] hover:bg-[#00A0D6] text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(0,194,255,0.2)] hover:shadow-[0_0_25px_rgba(0,194,255,0.4)]"
                >
                    {step === totalSteps ? 'Get Started' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};