import type { KAPLAYCtx, GameObj } from "../types";

const BUBBLE_PADDING_X = 20;
const BUBBLE_PADDING_Y = 12;
const BUBBLE_MAX_WIDTH = 400;
const BUBBLE_DURATION = 3; // seconds

// Track active bubbles per creature to destroy old ones
const activeBubbles = new Map<string, () => void>();

/**
 * Show a chat bubble above a creature
 * Returns the bubble game object (auto-destroys after duration)
 * Automatically removes any existing bubble for this creature
 */
export function showChatBubble(
  k: KAPLAYCtx,
  creature: GameObj,
  text: string,
  duration: number = BUBBLE_DURATION
): GameObj {
  // Destroy any existing bubble for this creature
  const creatureId = creature.creatureId as string;
  if (creatureId && activeBubbles.has(creatureId)) {
    const cleanupPrevious = activeBubbles.get(creatureId);
    if (cleanupPrevious) cleanupPrevious();
  }

  // Calculate bubble dimensions based on text
  const fontSize = 8;
  const charWidth = 7; // Approximate width per character for gameFont (Press Start 2P) at size 8
  const lineHeight = fontSize + 6;
  
  // Calculate how many lines the text will wrap to
  const textContentWidth = BUBBLE_MAX_WIDTH - (BUBBLE_PADDING_X * 2);
  const maxCharsPerLine = Math.floor(textContentWidth / charWidth);
  const numLines = Math.max(1, Math.ceil(text.length / maxCharsPerLine));
  
  // Calculate actual text width (for short texts, don't make bubble too wide)
  const actualTextWidth = Math.min(text.length * charWidth, textContentWidth);
  const bubbleWidth = actualTextWidth + (BUBBLE_PADDING_X * 2);
  const bubbleHeight = (lineHeight * numLines) + (BUBBLE_PADDING_Y * 2);

  // Position above creature (higher offset for larger bubbles)
  const bubbleX = creature.pos.x;
  const bubbleY = creature.pos.y - 60 - (bubbleHeight / 2);

  // Create bubble background
  const bubbleBg = k.add([
    k.rect(bubbleWidth, bubbleHeight, { radius: 6 }),
    k.pos(bubbleX, bubbleY),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.outline(2, k.Color.fromArray([60, 60, 60])),
    k.opacity(0),
    k.z(900),
    "chat-bubble-bg",
  ]);

  // Create bubble tail (triangle pointing down)
  const tailSize = 8;
  const bubbleTail = k.add([
    k.polygon([
      k.vec2(-tailSize, 0),
      k.vec2(tailSize, 0),
      k.vec2(0, tailSize + 2),
    ]),
    k.pos(bubbleX, bubbleY + bubbleHeight / 2),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.opacity(0),
    k.z(899),
    "chat-bubble-tail",
  ]);

  // Create text (use the content width, not the full max width, so text stays within padding)
  const bubbleText = k.add([
    k.text(text, { size: fontSize, font: "gameFont", width: textContentWidth, align: "center" }),
    k.pos(bubbleX, bubbleY),
    k.anchor("center"),
    k.color(40, 40, 40),
    k.opacity(0),
    k.z(901),
    "chat-bubble-text",
  ]);

  // Fade in animation
  let fadeInTime = 0;
  const fadeInDuration = 0.2;
  let lifetime = 0;
  let isFadingOut = false;
  let isCleanedUp = false;

  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;
    
    updateHandler.cancel();
    if (bubbleBg.exists()) bubbleBg.destroy();
    if (bubbleTail.exists()) bubbleTail.destroy();
    if (bubbleText.exists()) bubbleText.destroy();
    
    // Remove from active bubbles map
    if (creatureId) {
      activeBubbles.delete(creatureId);
    }
  }

  // Register cleanup function for this creature
  if (creatureId) {
    activeBubbles.set(creatureId, cleanup);
  }

  const updateHandler = k.onUpdate(() => {
    // Check if creature still exists
    if (!creature.exists()) {
      cleanup();
      return;
    }

    // Update position to follow creature
    const newBubbleY = creature.pos.y - 60 - (bubbleHeight / 2);
    bubbleBg.pos.x = creature.pos.x;
    bubbleBg.pos.y = newBubbleY;
    bubbleTail.pos.x = creature.pos.x;
    bubbleTail.pos.y = newBubbleY + bubbleHeight / 2;
    bubbleText.pos.x = creature.pos.x;
    bubbleText.pos.y = newBubbleY;

    // Fade in
    if (fadeInTime < fadeInDuration) {
      fadeInTime += k.dt();
      const alpha = Math.min(fadeInTime / fadeInDuration, 1);
      bubbleBg.opacity = alpha;
      bubbleTail.opacity = alpha;
      bubbleText.opacity = alpha;
    }

    // Track lifetime
    lifetime += k.dt();

    // Fade out
    if (lifetime > duration && !isFadingOut) {
      isFadingOut = true;
    }

    if (isFadingOut) {
      const fadeSpeed = 3;
      bubbleBg.opacity -= k.dt() * fadeSpeed;
      bubbleTail.opacity -= k.dt() * fadeSpeed;
      bubbleText.opacity -= k.dt() * fadeSpeed;

      if (bubbleBg.opacity <= 0) {
        cleanup();
      }
    }
  });

  // Return the background as the main bubble object
  return bubbleBg;
}

/**
 * Get the next dialogue line from a creature and advance the index
 */
export function getNextDialogue(creature: GameObj): string {
  const lines = creature.dialogueLines as string[];
  const index = creature.currentDialogueIndex as number;
  
  // Get current line
  const line = lines[index] ?? "...";
  
  // Advance index (loop back to start)
  creature.currentDialogueIndex = (index + 1) % lines.length;
  
  return line;
}
