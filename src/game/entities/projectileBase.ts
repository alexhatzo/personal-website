import type { GameObj } from "../types";
import { PROJECTILE } from "../constants";
import { distance } from "../utils";

/**
 * Configuration for a projectile's movement and lifetime
 */
export interface ProjectileConfig {
  speed: number;
  lifetime?: number; // Defaults to PROJECTILE.LIFETIME
  onExpire?: () => void;
}

/**
 * Calculate normalized direction vector from source to target
 * Returns direction components and angle for rotation
 */
export function calculateDirection(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number; angle: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = distance(from.x, from.y, to.x, to.y);
  
  return {
    x: dx / dist,
    y: dy / dist,
    angle: Math.atan2(dy, dx),
  };
}

/**
 * Creates a lifetime tracker for projectiles
 * Defaults to PROJECTILE.LIFETIME from constants
 * 
 * Usage:
 * ```
 * const tracker = createLifetimeTracker(); // Uses default lifetime
 * obj.onUpdate(() => {
 *   if (tracker.update(k.dt())) {
 *     cleanup();
 *   }
 * });
 * ```
 */
export function createLifetimeTracker(maxLifetime: number = PROJECTILE.LIFETIME) {
  let elapsed = 0;
  
  return {
    /**
     * Update elapsed time and check if expired
     * @returns true if the projectile should be destroyed
     */
    update: (dt: number): boolean => {
      elapsed += dt;
      return elapsed > maxLifetime;
    },
    
    /** Get current elapsed time */
    getElapsed: () => elapsed,
    
    /** Get progress as 0-1 ratio */
    getProgress: () => Math.min(elapsed / maxLifetime, 1),
    
    /** Reset the timer */
    reset: () => { elapsed = 0; },
  };
}

/**
 * Creates a cleanup function for multiple game objects
 * Safely destroys objects only if they still exist
 */
export function createCleanup(...objects: GameObj[]) {
  return () => {
    for (const obj of objects) {
      if (obj.exists()) {
        obj.destroy();
      }
    }
  };
}

/**
 * Creates projectile movement logic with lifetime tracking
 * 
 * This combines direction-based movement with automatic lifetime expiration.
 * Call the returned `update` function in your onUpdate handler.
 */
export function createProjectileMovement(
  obj: GameObj & { velocity?: { x: number; y: number } },
  direction: { x: number; y: number },
  config: ProjectileConfig
) {
  const lifetime = config.lifetime ?? PROJECTILE.LIFETIME;
  const lifetimeTracker = createLifetimeTracker(lifetime);
  const velocity = {
    x: direction.x * config.speed,
    y: direction.y * config.speed,
  };
  
  // Store velocity on the object if it accepts it
  if ('velocity' in obj) {
    obj.velocity = velocity;
  }
  
  return {
    /**
     * Update position and check lifetime
     * @returns false if the projectile should be destroyed
     */
    update: (dt: number): boolean => {
      if (lifetimeTracker.update(dt)) {
        config.onExpire?.();
        return false; // Signal to cleanup
      }
      
      // Update position
      obj.pos.x += velocity.x * dt;
      obj.pos.y += velocity.y * dt;
      
      return true; // Still alive
    },
    
    getElapsed: () => lifetimeTracker.getElapsed(),
    getProgress: () => lifetimeTracker.getProgress(),
    getVelocity: () => velocity,
  };
}
