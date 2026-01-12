import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize, Minimize, Settings, Bug } from 'lucide-react';
import FaceMeshView from './components/FaceMeshView';
import ThreeView, { ThreeViewHandle } from './components/ThreeView';
import CalibrationWizard from './components/CalibrationWizard';
import ShoeControlPanel from './components/ShoeControlPanel';
import { HeadPose, HeadPoseTracker } from './utils/headPose';
import { calibrationManager, CalibrationData } from './utils/calibration';

function App() {
  const [isCdnAvailable, setIsCdnAvailable] = useState(true);
  const [isCheckingCdn, setIsCheckingCdn] = useState(true);
  const [currentHeadPose, setCurrentHeadPose] = useState<HeadPose | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState<CalibrationData>(calibrationManager.getCalibration());
  const [debugMode, setDebugMode] = useState(false);
  const [shoePosition, setShoePosition] = useState({ x: 0, y: -0.09, z: -0.03 });
  const [shoeScale, setShoeScale] = useState(0.071);
  const [shoeRotation, setShoeRotation] = useState({ x: 0, y: -0.628, z: 0 });
  const headPoseTrackerRef = useRef(new HeadPoseTracker(0.3));
  const threeViewRef = useRef<ThreeViewHandle>(null);

  useEffect(() => {
    const checkCdnAvailability = async () => {
      setIsCheckingCdn(true);
      try {
        const faceMeshResponse = await fetch(
          'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
          { method: 'HEAD' }
        );

        const cameraResponse = await fetch(
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
          { method: 'HEAD' }
        );

        const drawingResponse = await fetch(
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
          { method: 'HEAD' }
        );

        setIsCdnAvailable(faceMeshResponse.ok && cameraResponse.ok && drawingResponse.ok);
      } catch (error) {
        console.error('Error checking CDN availability:', error);
        setIsCdnAvailable(false);
      } finally {
        setIsCheckingCdn(false);
      }
    };

    checkCdnAvailability();

    const intervalId = setInterval(checkCdnAvailability, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleHeadPoseUpdate = useCallback((rawPose: HeadPose | null) => {
    if (rawPose) {
      const smoothedPose = headPoseTrackerRef.current.extractHeadPoseFromLandmarks([
        Array(468).fill(null).map((_, i) => {
          if (i === 133) return { x: rawPose.x - 0.05, y: rawPose.y, z: 0 };
          if (i === 362) return { x: rawPose.x + 0.05, y: rawPose.y, z: 0 };
          if (i === 1) return { x: rawPose.x, y: rawPose.y, z: 0 };
          if (i === 33) return { x: rawPose.x - 0.08, y: rawPose.y, z: 0 };
          if (i === 263) return { x: rawPose.x + 0.08, y: rawPose.y, z: 0 };
          return { x: 0, y: 0, z: 0 };
        })
      ]);
      if (smoothedPose) {
        setCurrentHeadPose(smoothedPose);
      }
    } else {
      setCurrentHeadPose(null);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Error entering fullscreen:', error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Error exiting fullscreen:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!calibrationManager.isCalibrated()) {
      setShowCalibration(true);
    }
  }, []);

  const handleCalibrationComplete = (newCalibration: CalibrationData) => {
    setCalibration(newCalibration);
    if (threeViewRef.current) {
      threeViewRef.current.updateCalibration(newCalibration);
    }
  };

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    if (threeViewRef.current) {
      threeViewRef.current.setDebugMode(newDebugMode);
    }
  };

  const handleShoePositionChange = (x: number, y: number, z: number) => {
    setShoePosition({ x, y, z });
    if (threeViewRef.current) {
      threeViewRef.current.updateModelPosition(x, y, z);
    }
  };

  const handleShoeScaleChange = (scale: number) => {
    setShoeScale(scale);
    if (threeViewRef.current) {
      threeViewRef.current.updateModelScale(scale);
    }
  };

  const handleShoeRotationChange = (x: number, y: number, z: number) => {
    setShoeRotation({ x, y, z });
    if (threeViewRef.current) {
      threeViewRef.current.updateModelRotation(x, y, z);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (threeViewRef.current) {
        const pos = threeViewRef.current.getModelPosition();
        const scale = threeViewRef.current.getModelScale();
        const rot = threeViewRef.current.getModelRotation();
        setShoePosition(pos);
        setShoeScale(scale);
        setShoeRotation(rot);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      <main className="flex-1 relative">
        {!isCheckingCdn && !isCdnAvailable && (
          <div className="absolute top-4 left-4 right-4 z-30 max-w-2xl mx-auto p-3 bg-yellow-50 text-yellow-800 rounded-md">
            <p className="text-sm">
              We're having trouble connecting to the required resources. Please check your internet connection.
            </p>
          </div>
        )}

        <div className="absolute inset-0">
          <ThreeView
            headPose={currentHeadPose}
            ref={threeViewRef}
          />
        </div>

        <ShoeControlPanel
          onPositionChange={handleShoePositionChange}
          onScaleChange={handleShoeScaleChange}
          onRotationChange={handleShoeRotationChange}
          initialPosition={shoePosition}
          initialScale={shoeScale}
          initialRotation={shoeRotation}
        />

        <div className="absolute bottom-4 right-4 z-10 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
          <div className="w-64 h-48">
            <FaceMeshView onHeadPoseUpdate={handleHeadPoseUpdate} />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded transition-colors backdrop-blur-sm"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          <button
            onClick={() => setShowCalibration(true)}
            className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded transition-colors backdrop-blur-sm"
            aria-label="Calibration settings"
            title="Calibration settings"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={toggleDebugMode}
            className={`p-1.5 ${debugMode ? 'bg-blue-600' : 'bg-black bg-opacity-50'} hover:bg-opacity-70 text-white rounded transition-colors backdrop-blur-sm`}
            aria-label="Toggle debug mode"
            title="Toggle debug mode"
          >
            <Bug size={14} />
          </button>
        </div>
      </main>

      {showCalibration && (
        <CalibrationWizard
          onComplete={handleCalibrationComplete}
          onSkip={() => setShowCalibration(false)}
          onClose={() => setShowCalibration(false)}
        />
      )}
    </div>
  );
}

export default App;