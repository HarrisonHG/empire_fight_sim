import phaser from 'phaser';

/**
 * A place in the world for the player of a given team to respawn.
 * @extends Phaser.GameObjects.Zone
 * @property {string} team - The team that can respawn here.
 * @property {Phaser.GameObjects.Sprite} sprite - The sprite representing the respawn point
 * @property {Phaser.GameObjects.Text} text - The text label for the respawn point
 */
export default class RespawnPoint extends phaser.GameObjects.Zone {
    constructor(scene, x, y, team) {
        super(scene, x, y, 32, 32);
        this.team = team;
        this.setOrigin(0.5, 0.5);
        this.size = 100;
        this.setSize(this.size, this.size);
    
        // Create a sprite for the respawn point
        this.sprite = scene.add.sprite(x, y, 'respawn_point');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(0.5); // Adjust scale as needed
    
        // Create a text label for the respawn point
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
     * Place the respawn point in the world.
     * @param {number} x - The x coordinate to place the respawn point.
     * @param {number} y - The y coordinate to place the respawn point.
     * @param {Phaser.Scene} scene - The scene to add the respawn point to.
     */
    place(x, y, scene) {
        this.setPosition(x, y);
        this.sprite.setPosition(x, y);
        this.text.setPosition(x + 9, y - 7);
        this.text.setFontSize(8);
        scene.add.existing(this);
        
        // Units will wait here for a while until respawning in waves
        this.WAITING_AREA_SIZE = 2;
        this.waitingArea = [];
    }

    /**
     * Add a unit to the queue of units that are waiting to respawn at this rally point.
     * @param {Phaser.GameObjects.Sprite} unit - The unit to add to the
     */
    enterWaitingArea(unit) {

        if (!this.waitingArea.includes(unit)) {
            this.waitingArea.push(unit);
        }

        if (this.waitingArea.length >= this.WAITING_AREA_SIZE) {

            console.debug(`RallyPoint: ${this.team} waiting area is full, respawning all units.`);
            for (const u of this.waitingArea) {
                if (typeof u.respawn === 'function') {
                    u.respawn();
                }
            }
            this.waitingArea = [];
        }
    }
}