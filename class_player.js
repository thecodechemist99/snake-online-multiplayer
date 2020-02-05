/*
Class for player related data.
(c)2019 Florian Beck
*/

class Player {
  constructor(id, x, y, body, length, moveDir, score) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.body = [];
    this.length = 50;
    this.moveDir = Math.floor(Math.random(4));
    this.score = 0;
  }

  relocate(grid) {
    this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize;
    this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize;
  }
}

module.exports = Player;
