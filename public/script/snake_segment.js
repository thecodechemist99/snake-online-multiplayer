function draw() {
  drawSegment(20, 20, 15);
}

function drawSegment(xPos, yPos, size) {
  let pixelSize = size / 15;
  fill("#0000ff");
  noStroke();

  // top segment
  rect(xPos + 6 * pixelSize, yPos, 3 * pixelSize, 4 * pixelSize);

  // bottom segment
  rect(
    xPos + 6 * pixelSize,
    yPos + 11 * pixelSize,
    3 * pixelSize,
    4 * pixelSize
  );

  // left segments
  rect(xPos, yPos + 5 * pixelSize, 2 * pixelSize, pixelSize);
  rect(xPos, yPos + 7 * pixelSize, 3 * pixelSize, pixelSize);
  rect(xPos, yPos + 9 * pixelSize, 2 * pixelSize, pixelSize);

  // right segments
  rect(xPos + 13 * pixelSize, yPos + 5 * pixelSize, 2 * pixelSize, pixelSize);
  rect(xPos + 12 * pixelSize, yPos + 7 * pixelSize, 3 * pixelSize, pixelSize);
  rect(xPos + 13 * pixelSize, yPos + 9 * pixelSize, 2 * pixelSize, pixelSize);

  /* circle */
  // top piece
  rect(
    xPos + 5 * pixelSize,
    yPos + 4 * pixelSize,
    5 * pixelSize,
    2 * pixelSize
  );
  // bottom piece
  rect(
    xPos + 5 * pixelSize,
    yPos + 9 * pixelSize,
    5 * pixelSize,
    2 * pixelSize
  );

  // left top
  rect(
    xPos + 4 * pixelSize,
    yPos + 5 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // right top
  rect(
    xPos + 9 * pixelSize,
    yPos + 5 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // right bottom
  rect(
    xPos + 9 * pixelSize,
    yPos + 8 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // left bottom
  rect(
    xPos + 4 * pixelSize,
    yPos + 8 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // left piece
  rect(
    xPos + 3 * pixelSize,
    yPos + 6 * pixelSize,
    2 * pixelSize,
    3 * pixelSize
  );

  // right piece
  rect(
    xPos + 10 * pixelSize,
    yPos + 6 * pixelSize,
    2 * pixelSize,
    3 * pixelSize
  );
}
