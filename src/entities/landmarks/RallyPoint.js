import phaser from 'phaser';

/**
 * A place in the world for a team to move to when there is nothing else to do.
 * @extends Phaser.GameObjects.Zone
 * @property {string} team - The team that can respawn here.
 * @property {Phaser.GameObjects.Sprite} sprite - The sprite representing the respawn point
 * @property {Phaser.GameObjects.Text} text - The text label for the respawn point
 */
export default class RallyPoint extends phaser.GameObjects.Zone {
    constructor(scene, x, y, team) {
        super(scene, x, y, 32, 32);
        this.team = team;
        this.setOrigin(0.5, 0.5);
        this.setSize(100, 100);

        // Create a sprite for the rally point
        this.sprite = scene.add.sprite(x, y, 'rally_point');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(0.5); // Adjust scale as needed

        // Create a text label for the rally point
        this.text = scene.add.text(x, y - 20, team.toUpperCase(), {
            font: '16px Arial',
            fill: '#000000',
            align: 'center'
        });
        this.text.setOrigin(0.5, 0.5);

        // If debug, add a line for the zone's bounds
        if (scene.sys.settings.isDebug) {
            this.setDebug({ color: 0xff0000, alpha: 0.5 });
            this.scene.add.graphics()
                .lineStyle(1, 0xff0000, 1)
                .strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    /**
     * Place the rally point in the world.
     * @param {number} x - The x coordinate to place the rally point.
     * @param {number} y - The y coordinate to place the rally point.
     * @param {Phaser.Scene} scene - The scene to add the rally point to
     */
    place(x, y, scene) {
        this.setPosition(x, y);
        this.sprite.setPosition(x, y);
        this.text.setPosition(x + 9, y - 7);
        this.text.setFontSize(8);
        scene.add.existing(this);
    }
}