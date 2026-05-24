'use client';

import React, { useEffect, useRef } from 'react';
import { MapNode } from '../lib/types';

interface LiveLocationProps {
  initialX: number;
  initialY: number;
  activePath: MapNode[];
  onPositionUpdate: (pos: { x: number; y: number }) => void;
  heading: number;
  setHeading: (heading: number) => void;
}

/**
 * Geometric Vector Math: Projects tracking coordinates onto physical hallway pathlines
 */
function snapToLineSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const segmentLenSq = dx * dx + dy * dy;

  if (segmentLenSq === 0) return { x: ax, y: ay };

  // Calculate scaling projection value along vector length
  let t = ((px - ax) * dx + (py - ay) * dy) / segmentLenSq;
  t = Math.max(0, Math.min(1, t)); // Constrain position within current corridor segment boundaries

  return {
    x: ax + t * dx,
    y: ay + t * dy,
  };
}

export const LiveLocation: React.FC<LiveLocationProps> = ({
  initialX,
  initialY,
  activePath,
  onPositionUpdate,
  heading,
  setHeading,
}) => {
  const lastStepTime = useRef<number>(0);
  // Shared state references used in telemetry callbacks to prevent closures
  const stateRef = useRef({ heading, activePath, currentX: initialX, currentY: initialY });

  useEffect(() => {
    stateRef.current.heading = heading;
    stateRef.current.activePath = activePath;
  }, [heading, activePath]);

  useEffect(() => {
    stateRef.current.currentX = initialX;
    stateRef.current.currentY = initialY;
  }, [initialX, initialY]);

  useEffect(() => {
    // Sensor Variables
    const stepThreshold = 1.35; // Acceleration force variance filter threshold
    const stepCooldown = 450;    // Milliseconds between physical strides
    const stepSizeInGrid = 0.85; // Map grid layout advancement factor

    // 1. Process Device Compass Vectors
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let trueHeading = 0;
      if ((e as any).webkitCompassHeading !== undefined) {
        trueHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        trueHeading = 360 - e.alpha;
      } else {
        return;
      }
      setHeading(trueHeading);
    };

    // 2. Process Inertial Strides
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const netForce = Math.abs(magnitude - 9.81); // Filter out natural gravity baseline

      const now = Date.now();
      if (netForce > stepThreshold && (now - lastStepTime.current) > stepCooldown) {
        lastStepTime.current = now;

        const currentSettings = stateRef.current;
        const angleRad = (currentSettings.heading * Math.PI) / 180;
        
        // Translate trigonometric orientation variables into directional canvas offsets
        const dx = stepSizeInGrid * Math.sin(angleRad);
        const dy = -stepSizeInGrid * Math.cos(angleRad);

        const updatedX = Math.max(0, Math.min(100, currentSettings.currentX + dx));
        const updatedY = Math.max(0, Math.min(100, currentSettings.currentY + dy));

        let finalPosition = { x: updatedX, y: updatedY };

        // 3. Apply Hallway Vector Path Snapping
        if (currentSettings.activePath && currentSettings.activePath.length > 1) {
          let minDistance = Infinity;

          for (let i = 0; i < currentSettings.activePath.length - 1; i++) {
            const segmentPoint = snapToLineSegment(
              updatedX, updatedY,
              currentSettings.activePath[i].x, currentSettings.activePath[i].y,
              currentSettings.activePath[i + 1].x, currentSettings.activePath[i + 1].y
            );

            const distance = Math.sqrt(
              Math.pow(updatedX - segmentPoint.x, 2) + Math.pow(updatedY - segmentPoint.y, 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
              finalPosition = segmentPoint;
            }
          }
        }

        // Cache coordinates locally and trigger callback tracking updates
        currentSettings.currentX = finalPosition.x;
        currentSettings.currentY = finalPosition.y;
        onPositionUpdate(finalPosition);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [onPositionUpdate, setHeading]);

  return null;
};"use client";
import { useEffect, useState } from "react";

export default function LiveLocation() {
  const [pos, setPos] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (!pos) return <span className="text-xs text-slate-500">GPS...</span>;

  return (
    <span className="text-xs text-slate-400">
      📍 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
    </span>
  );
}
