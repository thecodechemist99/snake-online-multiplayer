function draw() {
  drawFruit(20, 20, 15);
}

function drawFruit(xPos, yPos, size) {
  let pixelSize = size / 15;
  fill("#ff0000");
  noStroke();

  /* border */
  // top piece
  rect(xPos + 2 * pixelSize, yPos, 11 * pixelSize, pixelSize);

  // right piece
  rect(xPos, yPos + 2 * pixelSize, pixelSize, 11 * pixelSize);

  // bottom piece
  rect(xPos + 2 * pixelSize, yPos + 14 * pixelSize, 11 * pixelSize, pixelSize);

  // left piece
  rect(xPos + 14 * pixelSize, yPos + 2 * pixelSize, pixelSize, 11 * pixelSize);

  // top left
  rect(xPos + pixelSize, yPos + pixelSize, pixelSize, pixelSize);

  // top right
  rect(xPos + 13 * pixelSize, yPos + pixelSize, pixelSize, pixelSize);

  // bottom right
  rect(xPos + 13 * pixelSize, yPos + 13 * pixelSize, pixelSize, pixelSize);

  // bottom left
  rect(xPos + pixelSize, yPos + 13 * pixelSize, pixelSize, pixelSize);

  /* eyes */
  rect(
    xPos + 4 * pixelSize,
    yPos + 3 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );
  rect(
    xPos + 9 * pixelSize,
    yPos + 3 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  /* mouth */
  rect(xPos + 3 * pixelSize, yPos + 9 * pixelSize, 9 * pixelSize, pixelSize);
  rect(xPos + 4 * pixelSize, yPos + 10 * pixelSize, 7 * pixelSize, pixelSize);
  rect(xPos + 5 * pixelSize, yPos + 11 * pixelSize, 5 * pixelSize, pixelSize);
}
