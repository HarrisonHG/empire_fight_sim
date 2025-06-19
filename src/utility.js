import Phaser from 'phaser';

const loadedImages = new Set();

/**
 * Load an image once, preventing duplicate loads.
 * @param {string} imageName - The name of the image to load.
 * @param {string} ext - The file extension of the image (e.g., 'png', 'jpg').
 * @param {Phaser.Scene} scene - The Phaser scene in which to load the image.
 * @param {Phaser.GameObjects.Sprite} [sprite] - Optional sprite to set the texture after loading.
 */
export function loadOnce(imageName, ext, scene, sprite) {

    if (sprite) {
        scene.load.once('complete', () => {
            sprite.setTexture(imageName);
        });
    }

    if (!loadedImages.has(imageName)) {
        scene.load.image(imageName, `assets/${imageName}.${ext}`);
        loadedImages.add(imageName);

        // This may be a terrible idea. If everything slows to a halt, consider changing
        // this flow.
        scene.load.start();
    }
}