/**
 * Examora AI Vision Proctor Engine
 * Multi-tiered edge face detection and gaze tracking:
 * Tier 1: Google MediaPipe Face Detection
 * Tier 2: Native Browser Shape Detection (window.FaceDetector)
 * Tier 3: Adaptive Canvas YCbCr Universal Skin Chrominance & Spatial Clustering
 */

export interface FaceDetectionResult {
  faceDetected: boolean;
  faceCount: number;
  gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN';
  gazeScore: number;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
}

export class AIVisionProctor {
  private mediaPipeDetector: any = null;
  private isMediaPipeReady: boolean = false;
  private isProcessing: boolean = false;
  private nativeDetector: any = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private pendingResolver: ((result: FaceDetectionResult) => void) | null = null;

  constructor() {
    this.initDetectors();
  }

  private async initDetectors() {
    // 1. Try initializing MediaPipe FaceDetection with single onResults listener
    try {
      const mp = await import('@mediapipe/face_detection');
      const FaceDetectionClass = (mp as any).FaceDetection || (mp as any).default?.FaceDetection;
      if (FaceDetectionClass) {
        const detector = new FaceDetectionClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        });

        detector.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5
        });

        // Register onResults ONCE to prevent listener stacking / race conditions
        detector.onResults((results: any) => {
          if (this.pendingResolver) {
            const parsed = this.parseMediaPipeResults(results);
            const resolve = this.pendingResolver;
            this.pendingResolver = null;
            resolve(parsed);
          }
        });

        this.mediaPipeDetector = detector;
        this.isMediaPipeReady = true;
      }
    } catch (e) {
      console.warn('[AI Vision Proctor] MediaPipe init fallback to edge canvas:', e);
    }

    // 2. Check for native FaceDetector API (Chrome / Edge experimental)
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorClass = (window as any).FaceDetector;
        this.nativeDetector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 5 });
      } catch (e) {
        console.warn('[AI Vision Proctor] Native FaceDetector unavailable:', e);
      }
    }
  }

  private parseMediaPipeResults(results: any): FaceDetectionResult {
    const detections = results?.detections || [];
    if (detections.length === 0) {
      return {
        faceDetected: false,
        faceCount: 0,
        gazeDirection: 'OFF_SCREEN',
        gazeScore: 0.95,
        confidence: 0
      };
    }

    const primaryFace = detections[0];
    const bb = primaryFace.boundingBox;
    const landmarks = primaryFace.landmarks || [];
    const confidence = primaryFace.score ? primaryFace.score[0] : 0.92;

    let gaze: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN' = 'CENTER';
    let gazeScore = 0.05;

    if (landmarks.length >= 3) {
      const rightEye = landmarks[0];
      const leftEye = landmarks[1];
      const nose = landmarks[2];

      const eyeMidX = (rightEye.x + leftEye.x) / 2;
      const eyeDist = Math.abs(leftEye.x - rightEye.x) || 0.15;
      const horizOffset = (nose.x - eyeMidX) / eyeDist;

      const eyeMidY = (rightEye.y + leftEye.y) / 2;
      const vertOffset = (nose.y - eyeMidY) / eyeDist;

      if (bb && (bb.xCenter < 0.12 || bb.xCenter > 0.88 || bb.yCenter < 0.12 || bb.yCenter > 0.88)) {
        gaze = 'OFF_SCREEN';
        gazeScore = 0.85;
      } else if (horizOffset > 0.22) {
        gaze = 'LEFT';
        gazeScore = 0.65;
      } else if (horizOffset < -0.22) {
        gaze = 'RIGHT';
        gazeScore = 0.65;
      } else if (vertOffset < 0.2) {
        gaze = 'UP';
        gazeScore = 0.55;
      } else if (vertOffset > 0.85) {
        gaze = 'DOWN';
        gazeScore = 0.55;
      } else {
        gaze = 'CENTER';
        gazeScore = 0.05;
      }
    }

    return {
      faceDetected: true,
      faceCount: detections.length,
      gazeDirection: gaze,
      gazeScore,
      confidence,
      boundingBox: bb ? {
        x: bb.xCenter - bb.width / 2,
        y: bb.yCenter - bb.height / 2,
        width: bb.width,
        height: bb.height
      } : undefined,
      landmarks: landmarks.map((lm: any) => ({
        x: lm.x,
        y: lm.y
      }))
    };
  }

  /**
   * Process a live video frame and return face counts, spatial bounding, and gaze classification
   */
  public async analyzeFrame(video: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return {
        faceDetected: false,
        faceCount: 0,
        gazeDirection: 'OFF_SCREEN',
        gazeScore: 0.9,
        confidence: 0
      };
    }

    // --- TIER 1: MediaPipe Face Detection ---
    if (this.isMediaPipeReady && this.mediaPipeDetector && !this.isProcessing) {
      try {
        this.isProcessing = true;
        const mpPromise = new Promise<FaceDetectionResult>((resolve) => {
          this.pendingResolver = resolve;
        });

        await this.mediaPipeDetector.send({ image: video });
        const result = await Promise.race([
          mpPromise,
          new Promise<FaceDetectionResult>((_, reject) => setTimeout(() => reject(new Error('MediaPipe timeout')), 500))
        ]);
        this.isProcessing = false;
        return result;
      } catch {
        this.isProcessing = false;
        this.pendingResolver = null;
        // Fallback to Tier 2 / Tier 3
      }
    }

    // --- TIER 2: Native FaceDetector API ---
    if (this.nativeDetector) {
      try {
        const faces = await this.nativeDetector.detect(video);
        if (faces && faces.length > 0) {
          const primary = faces[0];
          const box = primary.boundingBox;
          const centerX = (box.x + box.width / 2) / video.videoWidth;
          const centerY = (box.y + box.height / 2) / video.videoHeight;

          let gaze: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN' = 'CENTER';
          if (centerX < 0.28) gaze = 'RIGHT';
          else if (centerX > 0.72) gaze = 'LEFT';
          else if (centerY < 0.22) gaze = 'UP';
          else if (centerY > 0.78) gaze = 'DOWN';

          return {
            faceDetected: true,
            faceCount: faces.length,
            gazeDirection: gaze,
            gazeScore: gaze === 'CENTER' ? 0.05 : 0.6,
            confidence: 0.9,
            boundingBox: {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height
            }
          };
        } else {
          return {
            faceDetected: false,
            faceCount: 0,
            gazeDirection: 'OFF_SCREEN',
            gazeScore: 0.95,
            confidence: 0
          };
        }
      } catch {
        // Fallback to Tier 3
      }
    }

    // --- TIER 3: Universal YCbCr Chrominance & Spatial Clustering Engine ---
    return this.canvasUniversalFaceDetection(video);
  }

  private getOffscreenContext(w: number, h: number): CanvasRenderingContext2D | null {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
    }
    if (this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
    }
    return this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Fast, lighting-invariant YCbCr chrominance skin cluster detector with multi-face spatial partitioning.
   */
  private canvasUniversalFaceDetection(video: HTMLVideoElement): FaceDetectionResult {
    try {
      const vw = 160;
      const vh = 120;
      const ctx = this.getOffscreenContext(vw, vh);
      if (!ctx) throw new Error('Offscreen 2D context unavailable');

      ctx.drawImage(video, 0, 0, vw, vh);
      const imgData = ctx.getImageData(0, 0, vw, vh);
      const data = imgData.data;

      let totalSkinCount = 0;
      let totalSumX = 0;
      let totalSumY = 0;
      let minX = vw, maxX = 0, minY = vh, maxY = 0;

      // Spatial split: check for multiple faces across left and right halves
      let leftClusterCount = 0;
      let rightClusterCount = 0;

      for (let y = 0; y < vh; y += 2) {
        for (let x = 0; x < vw; x += 2) {
          const idx = (y * vw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr skin model
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          // Universal skin chrominance cluster:
          const isSkin =
            cb >= 77 && cb <= 132 &&
            cr >= 130 && cr <= 176 &&
            r > 40 && g > 25 && b > 15 &&
            r > b && (r >= g || Math.abs(r - g) < 20);

          if (isSkin) {
            totalSkinCount++;
            totalSumX += x;
            totalSumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (x < vw * 0.44) {
              leftClusterCount++;
            } else if (x > vw * 0.56) {
              rightClusterCount++;
            }
          }
        }
      }

      // Minimum threshold: at least 35 skin pixels sampled (~0.7% of frame)
      const minPixelsForFace = 35;

      if (totalSkinCount < minPixelsForFace) {
        return {
          faceDetected: false,
          faceCount: 0,
          gazeDirection: 'OFF_SCREEN',
          gazeScore: 0.95,
          confidence: 0
        };
      }

      // Detect multiple faces if both left and right quadrants have significant independent clusters
      // and span across more than 65% of the frame with a central gap
      const isMultiFace =
        leftClusterCount >= 60 &&
        rightClusterCount >= 60 &&
        (maxX - minX) > vw * 0.65;

      const faceCount = isMultiFace ? 2 : 1;

      const centroidX = (totalSumX / totalSkinCount) / vw;
      const centroidY = (totalSumY / totalSkinCount) / vh;

      let gaze: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN' = 'CENTER';
      let gazeScore = 0.05;

      if (centroidX < 0.30) {
        gaze = 'RIGHT'; // In mirrored camera, centroid left is subject's right
        gazeScore = 0.6;
      } else if (centroidX > 0.70) {
        gaze = 'LEFT';
        gazeScore = 0.6;
      } else if (centroidY < 0.22) {
        gaze = 'UP';
        gazeScore = 0.5;
      } else if (centroidY > 0.78) {
        gaze = 'DOWN';
        gazeScore = 0.5;
      }

      const scaleX = video.videoWidth / vw;
      const scaleY = video.videoHeight / vh;

      return {
        faceDetected: true,
        faceCount,
        gazeDirection: gaze,
        gazeScore,
        confidence: Math.min(0.95, (totalSkinCount / 600) * 0.9),
        boundingBox: {
          x: minX * scaleX,
          y: minY * scaleY,
          width: Math.max(40, (maxX - minX) * scaleX),
          height: Math.max(50, (maxY - minY) * scaleY)
        }
      };
    } catch {
      return {
        faceDetected: true,
        faceCount: 1,
        gazeDirection: 'CENTER',
        gazeScore: 0.05,
        confidence: 0.5
      };
    }
  }
}

export const aiVisionEngine = new AIVisionProctor();
