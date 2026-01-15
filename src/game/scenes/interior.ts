import type { KAPLAYCtx, GameObj, SectionType, InteriorSceneData } from "../types";
import { SIZES } from "../constants";
import { createFloorGrid, createRoomWalls, createUIText } from "../utils";
import { createPlayer, setupWorldBounds, getFloorColor, createInteriorFurniture } from "../entities";
import { BUILDING_CONTENT } from "../content";

const T = SIZES.TILE;
const { ROOM_W, ROOM_H } = SIZES;

/**
 * Create an interior scene for a building section
 */
function createInteriorScene(k: KAPLAYCtx, section: SectionType): void {
  k.scene(section, (data?: InteriorSceneData) => {
    const content = BUILDING_CONTENT[section];
    const offsetX = (k.width() - ROOM_W) / 2;
    const offsetY = (k.height() - ROOM_H) / 2;

    // === 1. Floor (CSS-based) ===
    const floorColor = getFloorColor(section);
    createFloorGrid(k, offsetX, offsetY, ROOM_W, ROOM_H, floorColor, -10);

    // === 2. Walls ===
    createRoomWalls(k, offsetX, offsetY, ROOM_W, ROOM_H);

    // === 3. Exit Door ===
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
      k.color(100, 70, 50),
      k.outline(1, k.Color.fromArray([70, 50, 35])),
      k.z(0),
    ]);
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
      k.area(),
      k.opacity(0),
      "exit",
      { returnPos: data?.returnPos ?? { x: 320, y: 280 } },
    ]);

    // === 4. Furniture ===
    createInteriorFurniture(k, section, offsetX, offsetY, ROOM_W);

    // === 5. Title ===
    k.add([
      k.text(content.title, { size: 16 }),
      k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(100),
    ]);

    // === 6. Content Board ===
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

    // === 7. Player ===
    const player = createPlayer(k, offsetX + ROOM_W / 2, offsetY + ROOM_H - T * 2.5, "up");

    // === 8. Room Bounds ===
    setupWorldBounds(
      k,
      player,
      offsetX + T + 8,
      offsetY + T * 2,
      offsetX + ROOM_W - T - 8,
      offsetY + ROOM_H - T + 4
    );

    // === 9. Exit Collision ===
    player.onCollide("exit", (exit: GameObj) => {
      k.go("city", { x: exit.returnPos.x, y: exit.returnPos.y + 8, dir: "down" });
    });

    // === 10. UI ===
    createUIText(k, "Walk down to exit", k.width() / 2, k.height() - 10, 8, [200, 200, 200]);
  });
}

/**
 * Setup all interior scenes
 */
export function setupInteriorScenes(k: KAPLAYCtx): void {
  const sections: SectionType[] = ["about", "projects", "skills", "experience", "contact"];
  sections.forEach((section) => createInteriorScene(k, section));
}
