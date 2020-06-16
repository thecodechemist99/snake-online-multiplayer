/*
 * Class to display the snake(s).
 * Distributed under the MIT License.
 * (c) 2020 Florian Beck
 */

import DisplayObject from "./displayObject.js";

export default class DisplaySnake extends DisplayObject {
  constructor(x, y, size) {
    super(x, y);
    this.size = size;
  }

  draw() {}

  drawSegment() {
    let pixelSize = this.size / 15;
    noStroke();
      
    // top segment
    rect(6 * pixelSize, 0, 3 * pixelSize, 4 * pixelSize);
      
    // bottom segment
    rect(
      6 * pixelSize,
      11 * pixelSize,
      3 * pixelSize,
      4 * pixelSize
    );
      
    // left segments
    rect(0, 5 * pixelSize, 2 * pixelSize, pixelSize);
    rect(0, 7 * pixelSize, 3 * pixelSize, pixelSize);
    rect(0, 9 * pixelSize, 2 * pixelSize, pixelSize);
    
    // right segments
    rect(13 * pixelSize, 5 * pixelSize, 2 * pixelSize, pixelSize);
    rect(12 * pixelSize, 7 * pixelSize, 3 * pixelSize, pixelSize);
    rect(13 * pixelSize, 9 * pixelSize, 2 * pixelSize, pixelSize);
    
    /* circle */
    
    // top piece
    rect(
      5 * pixelSize,
      4 * pixelSize,
      5 * pixelSize,
      2 * pixelSize
    );
    
    // bottom piece
    rect(
      5 * pixelSize,
      9 * pixelSize,
      5 * pixelSize,
      2 * pixelSize
    );
      
    // left top
    rect(
      4 * pixelSize,
      5 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
    
    // right top
    rect(
      9 * pixelSize,
      5 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
    
    // right bottom
    rect(
      9 * pixelSize,
      8 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
    
    // left bottom
    rect(
      4 * pixelSize,
      8 * pixelSize,
      2 * pixelSize,
      2 * pixelSize
    );
    
    // left piece
    rect(
      3 * pixelSize,
      6 * pixelSize,
      2 * pixelSize,
      3 * pixelSize
    );
    
    // right piece
    rect(
      10 * pixelSize,
      6 * pixelSize,
      2 * pixelSize,
      3 * pixelSize
    );
  }
}