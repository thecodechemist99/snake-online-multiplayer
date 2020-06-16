/*
Class for player related data.
(c)2019 Florian Beck
*/

export default class Player {
  constructor(id, x, y, body, length, moveDir, score) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.body = [];
    this.length = 0;
    this.moveDir = Math.floor(Math.random(4));
    this.score = 0;
  }

  relocate(grid) {
    this.x =
      Math.floor(Math.random() * (grid.width / 2) + grid.width / 4) *
      grid.fieldSize;
    this.y =
      Math.floor(Math.random() * (grid.height / 2) + grid.height / 4) *
      grid.fieldSize;
  }

  reset() {
    this.body = [];
    this.length = 0;
    this.moveDir = Math.floor(Math.random(4));
    this.score = 0;
  }
}