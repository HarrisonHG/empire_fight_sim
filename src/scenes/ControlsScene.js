import Phaser from 'phaser';

export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ControlsScene' });
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

    this.cameras.main.setBackgroundColor(0x101820);

    this.add.text(centerX, 60, 'Controls', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const lines = [
      'Hold a key, then Left Click to place:',
      '',
      'Units:',
      '  1 = Dawn unit',
      '  2 = Nevvar unit',
      '  3 = Jotun unit',
      '',
      'Respawn Points:',
      '  Numpad 1 = Dawn respawn',
      '  Numpad 2 = Nevvar respawn',
      '  Numpad 3 = Jotun respawn',
      '',
      'Rally Points:',
      '  Numpad 4 = Dawn rally',
      '  Numpad 5 = Nevvar rally',
      '  Numpad 6 = Jotun rally',
    ];

    const style = { fontFamily: 'Consolas, monospace', fontSize: '18px', color: '#dddddd' };
    this.add.text(centerX, 120, lines.join('\n'), style)
      .setOrigin(0.5, 0);

    const btnStyle = { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', backgroundColor: '#444444', padding: { x: 14, y: 8 } };
    const hoverStyle = { backgroundColor: '#666666' };

    const backBtn = this.add.text(centerX, this.sceneHeight - 60, 'Back', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setStyle(hoverStyle));
    backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: btnStyle.backgroundColor }));
    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene', { sceneWidth: this.sceneWidth, sceneHeight: this.sceneHeight });
    });
  }
}
