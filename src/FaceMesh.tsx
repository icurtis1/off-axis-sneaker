import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceMesh from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_LEFT_EYEBROW, FACEMESH_FACE_OVAL, FACEMESH_LIPS } from '@mediapipe/face_mesh';

const FaceMesh: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize FaceMesh
    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMeshInstance.onResults(onResults);

    // When the webcam is ready, set up the camera
    if (webcamRef.current && webcamRef.current.video) {
      const cameraInstance = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await faceMeshInstance.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480
      });
      
      cameraInstance.start()
        .then(() => setIsLoading(false))
        .catch(error => {
          console.error('Error starting camera:', error);
          setIsLoading(false);
        });
      
      setCamera(cameraInstance);
    }

    return () => {
      // Clean up
      if (camera) {
        camera.stop();
      }
      faceMeshInstance.close();
    };
  }, []);

  const onResults = (results: faceMesh.Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Make canvas transparent to see the webcam feed
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Only draw on canvas when we have results
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      // Draw the face mesh tesselation with reduced opacity
      for (const landmarks of results.multiFaceLandmarks) {
        // Draw the face mesh tesselation with less prominence
        drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, { color: 'rgba(192, 192, 192, 0.2)', lineWidth: 0.5 });
        
        // Draw facial features with thinner lines and slightly transparent colors
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, { color: 'rgba(255, 48, 48, 0.5)', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, { color: 'rgba(255, 48, 48, 0.5)', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: 'rgba(48, 255, 48, 0.5)', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, { color: 'rgba(48, 255, 48, 0.5)', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, { color: 'rgba(224, 224, 224, 0.5)', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_LIPS, { color: 'rgba(255, 128, 128, 0.5)', lineWidth: 1 });
        
        // Draw smaller landmark points
        drawLandmarks(ctx, landmarks, { color: 'rgba(48, 112, 255, 0.5)', lineWidth: 0.5, radius: 1 });
      }
    }

    ctx.restore();
  };

  return (
    <div className="relative w-[640px] h-[480px] mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20 text-white">
          <div className="text-center">
            <p className="text-xl">Loading camera...</p>
            <p className="text-sm mt-2">Please allow camera access when prompted</p>
          </div>
        </div>
      )}
      <Webcam
        ref={webcamRef}
        width={640}
        height={480}
        mirrored={true}
        className="absolute top-0 left-0 rounded-lg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user"
        }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 rounded-lg border border-gray-300 z-10"
      />
    </div>
  );
};

export default FaceMesh;