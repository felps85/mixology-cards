const LOW_RES_IMAGES = [
  "/drinks/white-russian.png",
] as const;

const LOW_RES_IMAGE_SET = new Set<string>(LOW_RES_IMAGES);

export function isLowResImage(imagePath: string) {
  return LOW_RES_IMAGE_SET.has(imagePath);
}

export { LOW_RES_IMAGES };
