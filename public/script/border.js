function draw() {
  drawBorder(20, 20, 700, 600, 20);
}

function drawBorder(xPos, yPos, xSize, ySize, strength) {
  fill("#ffffff");
  noStroke();

  for (let i = 0; i < ySize; i++) {
    for (let j = 0; j < xSize; j++) {
      if (
        i % 2 != 0 &&
        j % 2 != 0 &&
        (i <= strength ||
          i >= ySize - strength ||
          j <= strength ||
          j >= xSize - strength)
      ) {
        rect(xPos + j, yPos + i, 1, 1);
      }
    }
  }
}
