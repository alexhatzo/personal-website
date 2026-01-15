// Re-export all entity factories
export { createPlayer, setupCamera, setupWorldBounds, mobileInput } from "./player";
export {
  createTree,
  createBench,
  createLampPost,
  createStreetSign,
  createTrafficLight,
  createTrashCan,
  createMailbox,
  createFireHydrant,
  createCar,
  createFountain,
  createPlant,
} from "./decorations";
export {
  createBuilding,
  getFloorColor,
  createInteriorFurniture,
  BUILDINGS,
} from "./buildings";
