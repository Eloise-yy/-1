import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface GestureControllerProps {
  isEnabled: boolean;
  onGesture: (assembled: boolean) => void;
  onMove: (x: number, y: number, rotation: number) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ isEnabled, onGesture, onMove }) => {
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const [loaded, setLoaded] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      // Cleanup if disabled
      setLoaded(false);
      if(videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!isMountedRef.current) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!isMountedRef.current) return;

        // Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640,
                height: 480,
                facingMode: 'user'
            } 
        });
        
        if (!isMountedRef.current || !videoRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        const video = videoRef.current;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        
        video.onloadeddata = () => {
            if (isMountedRef.current) {
                predictWebcam();
                setLoaded(true);
            }
        };
        
        await video.play();

      } catch (err) {
        console.error("Camera/MediaPipe error:", err);
        setLoaded(false);
      }
    };

    init();

    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }
  }, [isEnabled]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current || !isMountedRef.current) return;

    // Only predict if video has enough data
    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const nowInMs = Date.now();
        const result = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];
          
          // 1. Gesture Detection (Open/Closed)
          const wrist = landmarks[0];
          const tips = [8, 12, 16, 20];
          
          let totalDist = 0;
          tips.forEach(idx => {
              const tip = landmarks[idx];
              const d = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
              totalDist += d;
          });
          
          const avgDist = totalDist / tips.length;

          if (avgDist < 0.25) {
              onGesture(true); // Closed -> Assemble
          } else if (avgDist > 0.35) {
              onGesture(false); // Open -> Scatter
          }

          // 2. Position Tracking
          // Calculate centroid
          const palmPoints = [0, 5, 9, 13, 17];
          let sumX = 0;
          let sumY = 0;
          palmPoints.forEach(idx => {
            sumX += landmarks[idx].x;
            sumY += landmarks[idx].y;
          });
          const avgX = sumX / palmPoints.length;
          const avgY = sumY / palmPoints.length;

          // Normalize -1 to 1. Mirror X.
          const normX = (avgX - 0.5) * -2; 
          const normY = (avgY - 0.5) * -2;

          // 3. Rotation Tracking (Roll)
          // Angle of line between Index MCP (5) and Pinky MCP (17)
          const p5 = landmarks[5];
          const p17 = landmarks[17];
          
          // Calculate angle in radians. 
          // Note: In video coordinates, Y increases downwards.
          // atan2(dy, dx). 
          // We want 0 when horizontal.
          const dx = p17.x - p5.x;
          const dy = p17.y - p5.y;
          const rotation = Math.atan2(dy, dx); 
          // Because of mirroring, we might need to invert or adjust, but let's pass raw first.
          // Usually p5 (index) is left of p17 (pinky) for a right hand facing camera? No, thumb is internal.
          // Let's just pass the raw angle, Tree will scale it.

          onMove(normX, normY, rotation);
        }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isEnabled) return null;

  return (
    <div className="absolute top-4 right-4 z-50 pointer-events-none">
       {/* Small preview to show camera is working */}
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-32 h-24 rounded-lg border border-yellow-500/30 overflow-hidden bg-black/80 backdrop-blur relative shadow-lg shadow-yellow-500/10">
            <p className="absolute bottom-1 left-2 text-[10px] text-yellow-500/80 font-mono z-10 bg-black/50 px-1 rounded">GESTURE INPUT</p>
            <div className="w-full h-full flex items-center justify-center relative">
                 {!loaded && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse absolute" />}
                 <div className="w-full h-full absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent" />
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>
          </div>
      </div>
    </div>
  );
};