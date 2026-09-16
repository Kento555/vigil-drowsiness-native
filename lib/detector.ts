// Detection using ML Kit face data (from react-native-vision-camera face detector)
// Instead of computing EAR manually, ML Kit provides leftEyeOpenProbability (0–1)
// and rightEyeOpenProbability (0–1), plus euler angles for head pose.

export type DetectionState = 'calibrating' | 'alert' | 'drowsy' | 'alarm';
export type EventCause = 'eyes' | 'yawn' | 'nod';

export interface FaceData {
  leftEyeOpenProbability: number;   // 0 = closed, 1 = open
  rightEyeOpenProbability: number;
  mouthOpenProbability?: number;    // if available from ML Kit
  pitchAngle: number;               // head tilt forward/back (degrees)
  yawAngle: number;                 // head left/right (degrees)
}

export interface DetectorConfig {
  eyeClosedThreshold: number;   // eye open prob below this = closed (0–1)
  warnSeconds: number;
  alarmSeconds: number;
  yawnThreshold: number;        // mouth open prob above this = yawning
  yawnSeconds: number;
  yawnsPerMinuteAlarm: number;
  nodPitchDelta: number;        // degrees above baseline = nodding
  nodSeconds: number;
  calibrationFrames: number;
}

export const DEFAULT_CONFIG: DetectorConfig = {
  eyeClosedThreshold: 0.4,
  warnSeconds: 1.0,
  alarmSeconds: 1.8,
  yawnThreshold: 0.7,
  yawnSeconds: 1.5,
  yawnsPerMinuteAlarm: 3,
  nodPitchDelta: 10,
  nodSeconds: 1.2,
  calibrationFrames: 60,
};

export interface DetectorUpdate {
  state: DetectionState;
  cause: EventCause | null;
  leftEye: number;
  rightEye: number;
  pitch: number;
  closureMs: number;
  yawnMs: number;
  nodMs: number;
  yawnCount: number;
}

export class DrowsinessDetector {
  private config: DetectorConfig;
  private calibrationCount = 0;
  private pitchBaseline: number | null = null;
  private pitchSamples: number[] = [];

  private closedSince: number | null = null;
  private yawnOpenSince: number | null = null;
  private nodSince: number | null = null;
  private yawnTimestamps: number[] = [];

  constructor(config: DetectorConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  reset() {
    this.calibrationCount = 0;
    this.pitchBaseline = null;
    this.pitchSamples = [];
    this.closedSince = null;
    this.yawnOpenSince = null;
    this.nodSince = null;
    this.yawnTimestamps = [];
  }

  update(face: FaceData, now: number): DetectorUpdate {
    const leftEye = face.leftEyeOpenProbability ?? 1;
    const rightEye = face.rightEyeOpenProbability ?? 1;
    const avgEye = (leftEye + rightEye) / 2;
    const pitch = face.pitchAngle ?? 0;
    const mouthOpen = face.mouthOpenProbability ?? 0;

    // Calibration phase
    if (this.pitchBaseline === null) {
      this.pitchSamples.push(pitch);
      this.calibrationCount++;
      if (this.calibrationCount >= this.config.calibrationFrames) {
        const sorted = [...this.pitchSamples].sort((a, b) => a - b);
        this.pitchBaseline = sorted[Math.floor(sorted.length / 2)];
      }
      return {
        state: 'calibrating', cause: null,
        leftEye, rightEye, pitch,
        closureMs: 0, yawnMs: 0, nodMs: 0, yawnCount: 0,
      };
    }

    // Eye closure
    const closed = avgEye < this.config.eyeClosedThreshold;
    let closureMs = 0;
    if (closed) {
      if (this.closedSince === null) this.closedSince = now;
      closureMs = now - this.closedSince;
    } else {
      this.closedSince = null;
    }

    // Yawn detection
    const yawning = mouthOpen > this.config.yawnThreshold;
    let yawnMs = 0;
    if (yawning) {
      if (this.yawnOpenSince === null) this.yawnOpenSince = now;
      yawnMs = now - this.yawnOpenSince;
      if (yawnMs > this.config.yawnSeconds * 1000 &&
          (this.yawnTimestamps.length === 0 ||
           now - this.yawnTimestamps[this.yawnTimestamps.length - 1] > 5000)) {
        this.yawnTimestamps.push(now);
      }
    } else {
      this.yawnOpenSince = null;
    }
    this.yawnTimestamps = this.yawnTimestamps.filter(t => now - t < 60_000);
    const yawnCount = this.yawnTimestamps.length;

    // Head nod
    const pitchDelta = pitch - this.pitchBaseline;
    const nodding = pitchDelta > this.config.nodPitchDelta;
    let nodMs = 0;
    if (nodding) {
      if (this.nodSince === null) this.nodSince = now;
      nodMs = now - this.nodSince;
    } else {
      this.nodSince = null;
    }

    // State decision
    let state: DetectionState = 'alert';
    let cause: EventCause | null = null;

    if (closureMs >= this.config.alarmSeconds * 1000) {
      state = 'alarm'; cause = 'eyes';
    } else if (nodMs >= this.config.nodSeconds * 1000) {
      state = 'alarm'; cause = 'nod';
    } else if (yawnCount >= this.config.yawnsPerMinuteAlarm) {
      state = 'alarm'; cause = 'yawn';
    } else if (closureMs >= this.config.warnSeconds * 1000) {
      state = 'drowsy'; cause = 'eyes';
    } else if (nodMs >= this.config.nodSeconds * 500) {
      state = 'drowsy'; cause = 'nod';
    } else if (yawnCount >= Math.max(1, this.config.yawnsPerMinuteAlarm - 1)) {
      state = 'drowsy'; cause = 'yawn';
    }

    return { state, cause, leftEye, rightEye, pitch, closureMs, yawnMs, nodMs, yawnCount };
  }
}
