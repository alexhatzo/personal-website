// Re-export all entity factories
export { createPlayer, setupCamera, setupWorldBounds, mobileInput, mobileAction } from "./player";
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
export {
  createCreature,
  findNearestCreature,
  playDeathAnimation,
  type CreatureConfig,
} from "./creatures";
export { throwPokeball, createCaptureEffect } from "./pokeball";
export { shootArrow, createArrowHitEffect } from "./arrow";
export { swingHammer, createHammerHitEffect } from "./hammer";
export {
  createWanderingCreature,
  findNearestWanderingCreature,
  type WanderingCreatureConfig,
} from "./wanderingCreature";
export { showChatBubble, getNextDialogue } from "./chatBubble";
export {
  BUILDING_CREATURE_CONFIGS,
  getCreatureConfigForSection,
  sectionHasCreatures,
  setCreatureLabels,
  type BuildingCreatureConfig,
  type ActionType,
} from "./creatureConfigs";

// Re-export sprite registry helpers for convenience
export {
  SPRITE_REGISTRY,
  getSpritesForType,
  getSpriteTypeForSprite,
  getSpriteTypeKey,
  type SpriteTypeConfig,
} from "../sprites";
