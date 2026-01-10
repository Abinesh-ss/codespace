import { Accelerometer, Gyroscope, Magnetometer } from "expo-sensors";

const STEP_LENGTH_METERS = 0.75;
const STEP_THRESHOLD = 1.5;

let currentPosition = { x: 0, y: 0, floor: 1 };
let currentHeading = 0;
let lastAcceleration = 0;

function detectStep(z) {
  const isStep = z > STEP_THRESHOLD && lastAcceleration <= STEP_THRESHOLD;
  lastAcceleration = z;
  return isStep;
}

function calculateHeading(magData) {
  const { x, y } = magData;
  let heading = Math.atan2(y, x) * (180 / Math.PI);
  if (heading < 0) heading += 360;
  return heading;
}

export function updatePosition(accelData, gyroData, magData) {
  if (magData) currentHeading = calculateHeading(magData);

  if (accelData && detectStep(accelData.z)) {
    const dirRad = currentHeading * (Math.PI / 180);
    currentPosition.x += STEP_LENGTH_METERS * Math.cos(dirRad);
    currentPosition.y += STEP_LENGTH_METERS * Math.sin(dirRad);
  }

  return { ...currentPosition, heading: currentHeading };
}

export function qrCodeCorrection(x, y, floor) {
  currentPosition = { x, y, floor };
  console.log("Position corrected via QR:", currentPosition);
  return currentPosition;
}

export function startSensorTracking(onUpdate) {
  let accelData, gyroData, magData;

  const accelSub = Accelerometer.addListener((data) => {
    accelData = data;
    const pos = updatePosition(accelData, gyroData, magData);
    onUpdate(pos);
  });

  const gyroSub = Gyroscope.addListener((data) => (gyroData = data));
  const magSub = Magnetometer.addListener((data) => (magData = data));

  Accelerometer.setUpdateInterval(200);
  Gyroscope.setUpdateInterval(200);
  Magnetometer.setUpdateInterval(200);

  return () => {
    accelSub.remove();
    gyroSub.remove();
    magSub.remove();
  };
}

