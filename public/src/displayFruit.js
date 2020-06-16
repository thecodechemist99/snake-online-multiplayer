/*
 * Class to display the fruit(s).
 * Distributed under the MIT License.
 * (c) 2020 Florian Beck
 */

import DisplayObject from "./displayObject.js";

export default class DisplayFruit extends DisplayObject {
  constructor(x, y, size) {
    super(x, y);
    this.size = size;
  }

  draw() {
    let pixelSize = this.size / 15;

    fill("#ff0000");
    noStroke();

    /* border */

    // top piece
    rect(2 * pixelSize, 0, 11 * pixelSize, pixelSize);
    // right piece
    rect(0, 2 * pixelSize, pixelSize, 11 * pixelSize);
    // bottom piece
    rect(2 * pixelSize, 14 * pixelSize, 11 * pixelSize, pixelSize);
    // left piece
    rect(14 * pixelSize, 2 * pixelSize, pixelSize, 11 * pixelSize);
    // top left
    rect(pixelSize, pixelSize, pixelSize, pixelSize);
    // top right
    rect(13 * pixelSize, pixelSize, pixelSize, pixelSize);
    // bottom right
    rect(13 * pixelSize, 13 * pixelSize, pixelSize, pixelSize);
    // bottom left
    rect(pixelSize, 13 * pixelSize, pixelSize, pixelSize);
  
    /* eyes */

    rect(
      4 * pixelSize,
      3 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
    rect(
      9 * pixelSize,
      3 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
  
    /* mouth */
    rect(3 * pixelSize, 9 * pixelSize, 9 * pixelSize, pixelSize);
    rect(4 * pixelSize, 10 * pixelSize, 7 * pixelSize, pixelSize);
    rect(5 * pixelSize, 11 * pixelSize, 5 * pixelSize, pixelSize);
  }
}