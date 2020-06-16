/*
Class for fruit related data.
(c)2019 Florian Beck
*/

export default class Fruit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  relocate(grid) {
    this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize;
    this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize;
  }
}
