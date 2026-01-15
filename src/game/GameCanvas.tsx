import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";

// Shared state for mobile controls
export const mobileInput = {
  left: false,
  right: false,
  up: false,
  down: false,
};

interface GameCanvasProps {
  onZoneEnter: (section: string) => void;
}

export default function GameCanvas({ onZoneEnter }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Clear any existing canvas elements
    canvasRef.current.innerHTML = "";

    // Initialize Kaplay with a wider view
    const k = kaplay({
      root: canvasRef.current,
      width: 400,
      height: 300,
      letterbox: true,
      crisp: true,
      background: [34, 139, 34], // Green grass background
    });

    gameRef.current = k;

    // Load player sprite
    // Row order: Down, Up, Left, Right
    k.loadSprite("player", "/sprites/player.png", {
      sliceX: 44,
      sliceY: 4,
      anims: {
        "idle-down": 0,
        "idle-up": 44,
        "idle-left": 88,
        "idle-right": 132,
        "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
        "walk-up": { from: 44, to: 47, loop: true, speed: 8 },
        "walk-left": { from: 88, to: 91, loop: true, speed: 8 },
        "walk-right": { from: 132, to: 135, loop: true, speed: 8 },
      },
    });

    // Main game scene
    k.scene("main", () => {
      const SPEED = 100;
      const TILE = 16;
      const WORLD_W = 640;
      const WORLD_H = 480;

      // Draw grass pattern
      for (let x = 0; x < WORLD_W; x += TILE) {
        for (let y = 0; y < WORLD_H; y += TILE) {
          const shade = Math.random() > 0.7 ? 5 : 0;
          k.add([
            k.rect(TILE, TILE),
            k.pos(x, y),
            k.color(34 + shade, 139 + shade, 34 + shade),
            k.z(-100),
          ]);
        }
      }

      // Create paths/plaza in center
      const plazaX = WORLD_W / 2 - 80;
      const plazaY = WORLD_H / 2 - 60;
      const plazaW = 160;
      const plazaH = 120;

      // Main plaza (stone)
      k.add([
        k.rect(plazaW, plazaH),
        k.pos(plazaX, plazaY),
        k.color(169, 169, 169),
        k.z(-50),
      ]);

      // Plaza border
      k.add([
        k.rect(plazaW + 8, plazaH + 8),
        k.pos(plazaX - 4, plazaY - 4),
        k.color(139, 119, 101),
        k.z(-51),
      ]);

      // Paths leading to buildings
      const pathColor: [number, number, number] = [169, 169, 169];
      // Top path
      k.add([k.rect(32, 80), k.pos(WORLD_W / 2 - 16, plazaY - 80), k.color(...pathColor), k.z(-50)]);
      // Bottom path  
      k.add([k.rect(32, 80), k.pos(WORLD_W / 2 - 16, plazaY + plazaH), k.color(...pathColor), k.z(-50)]);
      // Left path
      k.add([k.rect(80, 32), k.pos(plazaX - 80, WORLD_H / 2 - 16), k.color(...pathColor), k.z(-50)]);
      // Right path
      k.add([k.rect(80, 32), k.pos(plazaX + plazaW, WORLD_H / 2 - 16), k.color(...pathColor), k.z(-50)]);

      // Building configurations
      const buildings = [
        { x: WORLD_W / 2 - 40, y: 40, w: 80, h: 60, section: "about", label: "ABOUT ME", color: [200, 82, 82] as [number, number, number] },
        { x: WORLD_W / 2 - 40, y: WORLD_H - 100, w: 80, h: 60, section: "contact", label: "CONTACT", color: [162, 82, 200] as [number, number, number] },
        { x: 40, y: WORLD_H / 2 - 40, w: 70, h: 80, section: "projects", label: "PROJECTS", color: [82, 200, 118] as [number, number, number] },
        { x: WORLD_W - 110, y: WORLD_H / 2 - 40, w: 70, h: 80, section: "skills", label: "SKILLS", color: [82, 148, 200] as [number, number, number] },
        { x: 60, y: 60, w: 60, h: 50, section: "experience", label: "WORK", color: [200, 162, 82] as [number, number, number] },
      ];

      buildings.forEach((b) => {
        // Building shadow
        k.add([
          k.rect(b.w, b.h),
          k.pos(b.x + 4, b.y + 4),
          k.color(0, 0, 0),
          k.opacity(0.3),
          k.z(-10),
        ]);

        // Building body
        k.add([
          k.rect(b.w, b.h),
          k.pos(b.x, b.y),
          k.color(...b.color),
          k.outline(2, k.Color.fromArray([40, 40, 40])),
          k.z(0),
        ]);

        // Roof
        k.add([
          k.rect(b.w + 8, 6),
          k.pos(b.x - 4, b.y - 4),
          k.color(60, 60, 60),
          k.z(1),
        ]);

        // Door (centered at bottom)
        const doorX = b.x + b.w / 2 - 8;
        const doorY = b.y + b.h - 20;
        k.add([
          k.rect(16, 20),
          k.pos(doorX, doorY),
          k.color(101, 67, 33),
          k.outline(1, k.Color.fromArray([60, 40, 20])),
          k.z(1),
        ]);

        // Windows
        const winSize = 10;
        const winRows = Math.floor((b.h - 30) / 20);
        const winCols = Math.floor((b.w - 20) / 20);
        for (let row = 0; row < winRows; row++) {
          for (let col = 0; col < winCols; col++) {
            k.add([
              k.rect(winSize, winSize),
              k.pos(b.x + 10 + col * 20, b.y + 10 + row * 20),
              k.color(200, 220, 255),
              k.outline(1, k.Color.fromArray([40, 40, 40])),
              k.z(1),
            ]);
          }
        }

        // Label
        k.add([
          k.text(b.label, { size: 8 }),
          k.pos(b.x + b.w / 2, b.y - 12),
          k.anchor("center"),
          k.color(255, 255, 255),
          k.z(10),
        ]);

        // Interaction zone (at door)
        k.add([
          k.rect(24, 24),
          k.pos(doorX - 4, doorY),
          k.area(),
          k.opacity(0),
          "zone",
          { section: b.section },
        ]);

        // Building collision (solid walls)
        k.add([
          k.rect(b.w, b.h - 20),
          k.pos(b.x, b.y),
          k.area(),
          k.body({ isStatic: true }),
          k.opacity(0),
          "building",
        ]);
      });

      // Decorative elements - trees around the map
      const treePositions = [
        { x: 160, y: 80 }, { x: 480, y: 80 },
        { x: 160, y: 380 }, { x: 480, y: 380 },
        { x: 30, y: 180 }, { x: 30, y: 280 },
        { x: 600, y: 180 }, { x: 600, y: 280 },
        { x: 200, y: 200 }, { x: 440, y: 200 },
        { x: 200, y: 280 }, { x: 440, y: 280 },
      ];

      treePositions.forEach(({ x, y }) => {
        // Tree shadow
        k.add([
          k.circle(10),
          k.pos(x + 4, y + 20),
          k.color(0, 0, 0),
          k.opacity(0.2),
          k.z(-5),
        ]);
        // Trunk
        k.add([
          k.rect(6, 16),
          k.pos(x - 3, y + 4),
          k.color(101, 67, 33),
          k.z(5),
        ]);
        // Leaves
        k.add([
          k.circle(12),
          k.pos(x, y - 4),
          k.color(34, 100, 34),
          k.z(6),
        ]);
        // Tree collision
        k.add([
          k.circle(8),
          k.pos(x, y + 8),
          k.area(),
          k.body({ isStatic: true }),
          k.opacity(0),
        ]);
      });

      // Fountain in center of plaza
      k.add([
        k.circle(20),
        k.pos(WORLD_W / 2, WORLD_H / 2),
        k.color(100, 149, 237),
        k.outline(3, k.Color.fromArray([70, 70, 70])),
        k.z(10),
      ]);
      k.add([
        k.circle(8),
        k.pos(WORLD_W / 2, WORLD_H / 2),
        k.color(135, 206, 250),
        k.z(11),
      ]);
      // Fountain collision
      k.add([
        k.circle(22),
        k.pos(WORLD_W / 2, WORLD_H / 2),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
      ]);

      // Create player
      const player = k.add([
        k.sprite("player", { anim: "idle-down" }),
        k.pos(WORLD_W / 2, WORLD_H / 2 + 50),
        k.area({ scale: 0.6 }),
        k.body(),
        k.anchor("center"),
        k.z(50),
        "player",
      ]);

      let currentAnim = "idle-down";
      let direction = "down";

      // Movement controls (4 directions)
      k.onUpdate(() => {
        let moving = false;
        let dx = 0;
        let dy = 0;

        if (k.isKeyDown("left") || k.isKeyDown("a") || mobileInput.left) {
          dx = -SPEED * k.dt();
          direction = "left";
          moving = true;
        }
        if (k.isKeyDown("right") || k.isKeyDown("d") || mobileInput.right) {
          dx = SPEED * k.dt();
          direction = "right";
          moving = true;
        }
        if (k.isKeyDown("up") || k.isKeyDown("w") || mobileInput.up) {
          dy = -SPEED * k.dt();
          direction = "up";
          moving = true;
        }
        if (k.isKeyDown("down") || k.isKeyDown("s") || mobileInput.down) {
          dy = SPEED * k.dt();
          direction = "down";
          moving = true;
        }

        // Apply movement
        player.move(dx / k.dt(), dy / k.dt());

        // Clamp to world bounds
        player.pos.x = Math.max(16, Math.min(WORLD_W - 16, player.pos.x));
        player.pos.y = Math.max(16, Math.min(WORLD_H - 16, player.pos.y));

        // Update animation
        const newAnim = moving ? `walk-${direction}` : `idle-${direction}`;
        if (newAnim !== currentAnim) {
          player.play(newAnim);
          currentAnim = newAnim;
        }
      });

      // Camera follows player
      player.onUpdate(() => {
        const camX = Math.max(k.width() / 2, Math.min(WORLD_W - k.width() / 2, player.pos.x));
        const camY = Math.max(k.height() / 2, Math.min(WORLD_H - k.height() / 2, player.pos.y));
        k.setCamPos(camX, camY);
      });

      // Zone collision - enter building
      player.onCollide("zone", (zone) => {
        onZoneEnter(zone.section);
      });

      // Space to interact
      k.onKeyPress("space", () => {
        const zones = k.get("zone");
        zones.forEach((zone) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (player.isColliding(zone as any)) {
            onZoneEnter(zone.section);
          }
        });
      });

      // Instructions (fixed to screen)
      k.add([
        k.text("WASD or Arrows to move | Walk to doors to enter", { size: 8 }),
        k.pos(k.width() / 2, k.height() - 12),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(100),
      ]);

      // Welcome text
      k.add([
        k.text("Welcome to my Portfolio!", { size: 10 }),
        k.pos(k.width() / 2, 12),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(100),
      ]);
    });

    // Start the game
    k.go("main");

    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.quit();
        gameRef.current = null;
      }
    };
  }, [onZoneEnter]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
