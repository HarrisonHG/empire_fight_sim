import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  /**
   * @param {{ sceneWidth?: number, sceneHeight?: number }} data
   */
  init(data) {
    this.sceneWidth = data.sceneWidth || 800;
    this.sceneHeight = data.sceneHeight || 600;
  }

  create() {
    const centerX = this.sceneWidth / 2;
    const centerY = this.sceneHeight / 2;

    this.cameras.main.setBackgroundColor(0x1a1a1a);

    this.add.text(centerX, centerY - 120, 'Empire Fight Sim', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btnStyle = { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', backgroundColor: '#0066cc', padding: { x: 16, y: 10 } };
    const hoverStyle = { backgroundColor: '#3399ff' };

    const startBtn = this.add.text(centerX, centerY - 20, 'Start', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const controlsBtn = this.add.text(centerX, centerY + 50, 'Show Controls', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const makeHover = (obj) => {
      obj.on('pointerover', () => obj.setStyle(hoverStyle));
      obj.on('pointerout', () => obj.setStyle({ backgroundColor: btnStyle.backgroundColor }));
    };
    makeHover(startBtn);
    makeHover(controlsBtn);

    startBtn.on('pointerdown', () => {
      this.scene.start('BattleScene', { sceneWidth: this.sceneWidth, sceneHeight: this.sceneHeight });
    });

    controlsBtn.on('pointerdown', () => {
      this.scene.start('ControlsScene', { sceneWidth: this.sceneWidth, sceneHeight: this.sceneHeight });
    });
  }
}
