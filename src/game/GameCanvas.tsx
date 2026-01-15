import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx, GameObj } from "kaplay";

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

// Content for each building interior - shorter lines for readability
const buildingContent: Record<string, { title: string; lines: string[] }> = {
  about: {
    title: "About Me",
    lines: [
      "Hi! I'm a developer who",
      "loves building creative",
      "web experiences.",
      "",
      "Skills: React, TypeScript",
      "This site proves websites",
      "can be fun to explore!",
    ],
  },
  projects: {
    title: "My Projects",
    lines: [
      "1. This Portfolio!",
      "   Walk around & explore",
      "",
      "2. Project Two",
      "   A cool app I built",
      "",
      "3. Project Three",
      "   Another creation",
    ],
  },
  skills: {
    title: "My Skills",
    lines: [
      "Frontend:",
      "  React, TypeScript, CSS",
      "",
      "Backend:",
      "  Node.js, Python, SQL",
      "",
      "Tools:",
      "  Git, Docker, AWS",
    ],
  },
  experience: {
    title: "Work History",
    lines: [
      "2023 - Now",
      "  Senior Dev @ Company",
      "",
      "2021 - 2023",
      "  Engineer @ Startup",
      "",
      "2019 - 2021",
      "  Junior @ First Job",
    ],
  },
  contact: {
    title: "Contact Me",
    lines: [
      "Email:",
      "  hello@example.com",
      "",
      "GitHub:",
      "  github.com/you",
      "",
      "LinkedIn:",
      "  linkedin.com/in/you",
    ],
  },
};

export default function GameCanvas({ onZoneEnter }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;
    canvasRef.current.innerHTML = "";

    const k = kaplay({
      root: canvasRef.current,
      width: 480,
      height: 320,
      letterbox: true,
      crisp: true,
      background: [34, 100, 34],
    });

    gameRef.current = k;

    // Load sprites
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

    k.loadSprite("tiles", "/sprites/tilemap.png", {
      sliceX: 27,
      sliceY: 16,
    });

    const SPEED = 100;
    const T = 16; // Tile size

    // Helper to create player
    function createPlayer(x: number, y: number, dir: string = "down") {
      const player = k.add([
        k.sprite("player", { anim: `idle-${dir}` }),
        k.pos(x, y),
        k.area({ scale: 0.5 }),
        k.body(),
        k.anchor("center"),
        k.z(100),
        "player",
      ]);

      let currentAnim = `idle-${dir}`;
      let direction = dir;

      k.onUpdate(() => {
        if (!player.exists()) return;
        let moving = false;
        let dx = 0, dy = 0;

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

        player.move(dx / k.dt(), dy / k.dt());

        const newAnim = moving ? `walk-${direction}` : `idle-${direction}`;
        if (newAnim !== currentAnim) {
          player.play(newAnim);
          currentAnim = newAnim;
        }
      });

      return player;
    }

    // ========== CITY SCENE ==========
    k.scene("city", (startPos?: { x: number; y: number; dir: string }) => {
      const WORLD_W = 640;
      const WORLD_H = 480;

      // Grass background with variation
      for (let x = 0; x < WORLD_W; x += T) {
        for (let y = 0; y < WORLD_H; y += T) {
          const grassTile = Math.random() > 0.8 ? 298 : 297;
          k.add([k.sprite("tiles", { frame: grassTile }), k.pos(x, y), k.z(-100)]);
        }
      }

      // Main plaza (stone tiles)
      const plazaX = 200, plazaY = 160, plazaW = 240, plazaH = 160;
      for (let x = plazaX; x < plazaX + plazaW; x += T) {
        for (let y = plazaY; y < plazaY + plazaH; y += T) {
          k.add([k.sprite("tiles", { frame: 54 }), k.pos(x, y), k.z(-50)]);
        }
      }

      // Roads
      const roadTile = 56;
      // Horizontal road
      for (let x = 0; x < WORLD_W; x += T) {
        for (let y = plazaY + plazaH; y < plazaY + plazaH + T * 2; y += T) {
          k.add([k.sprite("tiles", { frame: roadTile }), k.pos(x, y), k.z(-50)]);
        }
      }
      // Road markings
      for (let x = 0; x < WORLD_W; x += T * 3) {
        k.add([k.rect(T * 1.5, 2), k.pos(x, plazaY + plazaH + T - 1), k.color(255, 255, 200), k.z(-49)]);
      }

      // Paths to buildings
      const pathTile = 54;
      // Top path
      for (let y = 80; y < plazaY; y += T) {
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(WORLD_W / 2 - T, y), k.z(-50)]);
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(WORLD_W / 2, y), k.z(-50)]);
      }
      // Left path
      for (let x = 80; x < plazaX; x += T) {
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(x, WORLD_H / 2 - T), k.z(-50)]);
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(x, WORLD_H / 2), k.z(-50)]);
      }
      // Right path  
      for (let x = plazaX + plazaW; x < 560; x += T) {
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(x, WORLD_H / 2 - T), k.z(-50)]);
        k.add([k.sprite("tiles", { frame: pathTile }), k.pos(x, WORLD_H / 2), k.z(-50)]);
      }

      // Buildings data
      const buildings = [
        { x: WORLD_W / 2 - 40, y: 20, w: 80, h: 56, section: "about", label: "ABOUT ME", color: [180, 60, 60] },
        { x: 16, y: WORLD_H / 2 - 40, w: 64, h: 80, section: "projects", label: "PROJECTS", color: [60, 160, 80] },
        { x: 560, y: WORLD_H / 2 - 40, w: 64, h: 80, section: "skills", label: "SKILLS", color: [60, 120, 180] },
        { x: 100, y: 380, w: 80, h: 56, section: "experience", label: "EXPERIENCE", color: [180, 140, 60] },
        { x: 460, y: 380, w: 80, h: 56, section: "contact", label: "CONTACT", color: [140, 60, 180] },
      ] as const;

      buildings.forEach((b) => {
        // Building shadow
        k.add([k.rect(b.w, b.h), k.pos(b.x + 3, b.y + 3), k.color(0, 0, 0), k.opacity(0.3), k.z(0)]);
        // Building body
        k.add([k.rect(b.w, b.h), k.pos(b.x, b.y), k.color(b.color[0], b.color[1], b.color[2]), k.outline(2, k.Color.fromArray([30, 30, 30])), k.z(1)]);
        // Roof
        k.add([k.rect(b.w + 8, 5), k.pos(b.x - 4, b.y - 3), k.color(50, 50, 50), k.z(2)]);
        // Door
        const doorX = b.x + b.w / 2 - 8;
        const doorY = b.y + b.h - 16;
        k.add([k.rect(16, 16), k.pos(doorX, doorY), k.color(80, 50, 30), k.outline(1, k.Color.fromArray([40, 25, 15])), k.z(2)]);
        // Windows
        const winCols = Math.floor((b.w - 24) / 20);
        const winRows = Math.floor((b.h - 24) / 20);
        for (let r = 0; r < winRows; r++) {
          for (let c = 0; c < winCols; c++) {
            k.add([k.rect(10, 10), k.pos(b.x + 10 + c * 20, b.y + 8 + r * 20), k.color(180, 200, 230), k.outline(1, k.Color.fromArray([30, 30, 30])), k.z(2)]);
          }
        }
        // Label
        k.add([k.text(b.label, { size: 8 }), k.pos(b.x + b.w / 2, b.y - 10), k.anchor("center"), k.color(255, 255, 255), k.z(10)]);
        // Door collision - teleports to interior
        k.add([
          k.rect(20, 8),
          k.pos(doorX - 2, doorY + 16),
          k.area(),
          k.opacity(0),
          "door",
          { section: b.section, doorPos: { x: b.x + b.w / 2, y: b.y + b.h + 24 } },
        ]);
        // Building collision (walls)
        k.add([k.rect(b.w, b.h - 12), k.pos(b.x, b.y), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
      });

      // Decorations - Trees
      const treePositions = [
        { x: 150, y: 100 }, { x: 490, y: 100 },
        { x: 140, y: 200 }, { x: 500, y: 200 },
        { x: 140, y: 280 }, { x: 500, y: 280 },
        { x: 220, y: 380 }, { x: 420, y: 380 },
        { x: 300, y: 440 }, { x: 340, y: 440 },
      ];
      treePositions.forEach(({ x, y }) => {
        k.add([k.sprite("tiles", { frame: 324 }), k.pos(x - 8, y - 8), k.z(y)]);
        k.add([k.circle(6), k.pos(x, y), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
      });

      // Benches
      [[plazaX + 30, plazaY + 30], [plazaX + plazaW - 46, plazaY + 30], [plazaX + 30, plazaY + plazaH - 30], [plazaX + plazaW - 46, plazaY + plazaH - 30]].forEach(([x, y]) => {
        k.add([k.sprite("tiles", { frame: 379 }), k.pos(x, y), k.z(y + 8)]);
        k.add([k.rect(16, 10), k.pos(x, y + 4), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
      });

      // Lamp posts
      [[plazaX - 20, plazaY + 40], [plazaX + plazaW + 4, plazaY + 40], [plazaX - 20, plazaY + plazaH - 24], [plazaX + plazaW + 4, plazaY + plazaH - 24]].forEach(([x, y]) => {
        k.add([k.sprite("tiles", { frame: 351 }), k.pos(x, y), k.z(y + 16)]);
        k.add([k.circle(4), k.pos(x + 8, y + 12), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
      });

      // Parked cars along the road
      [[50, plazaY + plazaH + 6], [180, plazaY + plazaH + 6], [400, plazaY + plazaH + 6], [550, plazaY + plazaH + 6]].forEach(([x, y], i) => {
        const carFrame = i % 2 === 0 ? 405 : 407;
        k.add([k.sprite("tiles", { frame: carFrame }), k.pos(x, y), k.z(y + 8)]);
        k.add([k.rect(24, 14), k.pos(x - 4, y), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
      });

      // Fountain in center
      k.add([k.circle(24), k.pos(WORLD_W / 2, plazaY + plazaH / 2), k.color(70, 130, 180), k.outline(3, k.Color.fromArray([50, 50, 50])), k.z(50)]);
      k.add([k.circle(10), k.pos(WORLD_W / 2, plazaY + plazaH / 2), k.color(135, 206, 250), k.z(51)]);
      k.add([k.circle(26), k.pos(WORLD_W / 2, plazaY + plazaH / 2), k.area(), k.body({ isStatic: true }), k.opacity(0)]);

      // Player
      const spawnX = startPos?.x ?? WORLD_W / 2;
      const spawnY = startPos?.y ?? plazaY + plazaH / 2 + 50;
      const spawnDir = startPos?.dir ?? "down";
      const player = createPlayer(spawnX, spawnY, spawnDir);

      // Camera
      player.onUpdate(() => {
        const camX = Math.max(k.width() / 2, Math.min(WORLD_W - k.width() / 2, player.pos.x));
        const camY = Math.max(k.height() / 2, Math.min(WORLD_H - k.height() / 2, player.pos.y));
        k.setCamPos(camX, camY);
      });

      // Clamp player to world
      player.onUpdate(() => {
        player.pos.x = Math.max(16, Math.min(WORLD_W - 16, player.pos.x));
        player.pos.y = Math.max(16, Math.min(WORLD_H - 16, player.pos.y));
      });

      // Door collision - enter building
      player.onCollide("door", (door: GameObj) => {
        k.go(door.section, { returnPos: door.doorPos });
      });

      // UI
      k.add([k.text("Welcome to my Portfolio!", { size: 10 }), k.pos(k.width() / 2, 10), k.anchor("center"), k.color(255, 255, 255), k.fixed(), k.z(200)]);
      k.add([k.text("Walk into building doors to explore", { size: 8 }), k.pos(k.width() / 2, k.height() - 10), k.anchor("center"), k.color(220, 220, 220), k.fixed(), k.z(200)]);
    });

    // ========== INTERIOR SCENE FACTORY ==========
    function createInteriorScene(section: string) {
      k.scene(section, (data?: { returnPos: { x: number; y: number } }) => {
        const content = buildingContent[section];
        const ROOM_W = 280;
        const ROOM_H = 220;
        const offsetX = (k.width() - ROOM_W) / 2;
        const offsetY = (k.height() - ROOM_H) / 2;

        // Floor
        for (let x = 0; x < ROOM_W; x += T) {
          for (let y = 0; y < ROOM_H; y += T) {
            const floorTile = section === "about" ? 81 : section === "projects" ? 83 : section === "skills" ? 82 : section === "experience" ? 84 : 85;
            k.add([k.sprite("tiles", { frame: floorTile }), k.pos(offsetX + x, offsetY + y), k.z(-10)]);
          }
        }

        // Walls
        for (let x = 0; x < ROOM_W; x += T) {
          k.add([k.sprite("tiles", { frame: 27 }), k.pos(offsetX + x, offsetY), k.z(0)]);
          k.add([k.rect(T, T), k.pos(offsetX + x, offsetY), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
        }
        for (let y = 0; y < ROOM_H; y += T) {
          k.add([k.sprite("tiles", { frame: 27 }), k.pos(offsetX, offsetY + y), k.z(0)]);
          k.add([k.sprite("tiles", { frame: 27 }), k.pos(offsetX + ROOM_W - T, offsetY + y), k.z(0)]);
          k.add([k.rect(T, T), k.pos(offsetX, offsetY + y), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
          k.add([k.rect(T, T), k.pos(offsetX + ROOM_W - T, offsetY + y), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
        }
        for (let x = 0; x < ROOM_W; x += T) {
          if (x < ROOM_W / 2 - T || x > ROOM_W / 2) {
            k.add([k.sprite("tiles", { frame: 27 }), k.pos(offsetX + x, offsetY + ROOM_H - T), k.z(0)]);
            k.add([k.rect(T, T), k.pos(offsetX + x, offsetY + ROOM_H - T), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
          }
        }

        // Exit door (bottom center) - zone inside the room so player can reach it
        k.add([k.sprite("tiles", { frame: 189 }), k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T), k.z(0)]);
        k.add([
          k.rect(T * 2, T),
          k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
          k.area(),
          k.opacity(0),
          "exit",
          { returnPos: data?.returnPos ?? { x: 320, y: 280 } },
        ]);

        // Furniture based on room type
        if (section === "about" || section === "contact") {
          // Desk
          k.add([k.sprite("tiles", { frame: 135 }), k.pos(offsetX + ROOM_W - T * 3, offsetY + T * 2), k.z(50)]);
          k.add([k.rect(T, T), k.pos(offsetX + ROOM_W - T * 3, offsetY + T * 2), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
          // Chair
          k.add([k.sprite("tiles", { frame: 377 }), k.pos(offsetX + ROOM_W - T * 3, offsetY + T * 3 + 4), k.z(50)]);
          // Plant
          k.add([k.sprite("tiles", { frame: 327 }), k.pos(offsetX + T * 2, offsetY + T * 2), k.z(50)]);
          k.add([k.circle(6), k.pos(offsetX + T * 2 + 8, offsetY + T * 2 + 8), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
        } else if (section === "projects" || section === "skills") {
          // Bookshelf
          k.add([k.sprite("tiles", { frame: 162 }), k.pos(offsetX + T * 2, offsetY + T + 4), k.z(50)]);
          k.add([k.rect(T, T * 2), k.pos(offsetX + T * 2, offsetY + T), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
          // Computer desk
          k.add([k.sprite("tiles", { frame: 136 }), k.pos(offsetX + ROOM_W - T * 3, offsetY + T * 2), k.z(50)]);
          k.add([k.rect(T, T), k.pos(offsetX + ROOM_W - T * 3, offsetY + T * 2), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
        } else {
          // Couch
          k.add([k.sprite("tiles", { frame: 378 }), k.pos(offsetX + T * 2, offsetY + T * 2), k.z(50)]);
          k.add([k.sprite("tiles", { frame: 378 }), k.pos(offsetX + T * 3, offsetY + T * 2), k.z(50)]);
          k.add([k.rect(T * 2, T), k.pos(offsetX + T * 2, offsetY + T * 2), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
        }

        // Title - large and clear
        k.add([
          k.text(content.title, { size: 16 }),
          k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
          k.anchor("center"),
          k.color(255, 255, 255),
          k.z(100),
        ]);

        // Content text (on a sign/board) - larger board and text
        k.add([
          k.rect(200, 120),
          k.pos(offsetX + ROOM_W / 2 - 100, offsetY + T * 2 + 4),
          k.color(50, 40, 30),
          k.outline(3, k.Color.fromArray([80, 60, 40])),
          k.z(90),
        ]);
        content.lines.forEach((line, i) => {
          k.add([
            k.text(line, { size: 10 }),
            k.pos(offsetX + ROOM_W / 2 - 92, offsetY + T * 2 + 14 + i * 14),
            k.color(255, 250, 230),
            k.z(100),
          ]);
        });

        // Player spawns at door
        const player = createPlayer(offsetX + ROOM_W / 2, offsetY + ROOM_H - T * 2.5, "up");

        // Clamp to room - allow reaching the exit door at bottom
        player.onUpdate(() => {
          player.pos.x = Math.max(offsetX + T + 8, Math.min(offsetX + ROOM_W - T - 8, player.pos.x));
          player.pos.y = Math.max(offsetY + T * 2, Math.min(offsetY + ROOM_H - T + 4, player.pos.y));
        });

        // Exit collision
        player.onCollide("exit", (exit: GameObj) => {
          k.go("city", { x: exit.returnPos.x, y: exit.returnPos.y + 8, dir: "down" });
        });

        // UI
        k.add([k.text("Walk down to exit", { size: 8 }), k.pos(k.width() / 2, k.height() - 10), k.anchor("center"), k.color(200, 200, 200), k.fixed(), k.z(200)]);
      });
    }

    // Create all interior scenes
    Object.keys(buildingContent).forEach(createInteriorScene);

    // Start
    k.go("city");

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
