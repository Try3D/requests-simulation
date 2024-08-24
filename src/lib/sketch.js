import p5 from "p5";

/** @param {p5} p */
export default function p5Sketch(p) {
  let buttonPos;
  let pillPos;
  let roundedBoxPos;
  let blackCirclePos;
  let circles = [];
  let droppedCircles = [];
  let isAnimating = false;

  let queuePos1, queuePos2, queuePos3;

  p.setup = () => {
    p.createCanvas(1200, 200);

    buttonPos = { x: p.width * 0.1, y: p.height / 2 };
    pillPos = { x: p.width / 2, y: p.height / 2 };
    roundedBoxPos = { x: p.width * 0.9, y: p.height / 2 };

    blackCirclePos = { x: buttonPos.x + 4, y: buttonPos.y + 4 };

    queuePos1 = { x: pillPos.x + 80, y: pillPos.y };
    queuePos2 = { x: pillPos.x, y: pillPos.y };
    queuePos3 = { x: pillPos.x - 80, y: pillPos.y };
  };

  p.draw = () => {
    p.background("#ffffff");

    drawElements();

    let toRemove = [];

    for (let i = 0; i < circles.length; i++) {
      let circle = circles[i];

      switch (circle.state) {
        case "startToQueue":
          let targetX;
          if (circle.queuePos === 1) targetX = queuePos1.x;
          if (circle.queuePos === 2) targetX = queuePos2.x;
          if (circle.queuePos === 3) targetX = queuePos3.x;

          if (circle.x < targetX) {
            circle.x += 20;
          } else {
            circle.state = "inQueue";
          }
          break;

        case "inQueue":
          if (!isAnimating && !isAnyCircleMoving() && circle.queuePos === 1) {
            circle.state = "queueToRoundBox";
            isAnimating = true;

            moveQueueForward();
          }
          break;

        case "queueToRoundBox":
          if (circle.x < roundedBoxPos.x) {
            circle.x += 20;

            circle.color = p.lerpColor(
              circle.color,
              circle.targetColor,
              circle.colorTransitionSpeed,
            );
          } else {
            circle.state = "executingInRoundBox";
          }
          break;

        case "executingInRoundBox":
          circle.angle = (circle.angle || 360) - 5;
          if (circle.angle <= 5) {
            isAnimating = false;
            toRemove.push(i);
          }
          break;

        case "moveRightThenProjectile":
          if (circle.x > buttonPos.x + 300) {
            circle.state = "projectileAnimation";
          } else {
            circle.x += 20;
          }
          break;

        case "projectileAnimation":
          circle.x += circle.vx;
          circle.y += circle.vy;
          circle.vy += circle.gravity;

          circle.color = p.lerpColor(
            circle.color,
            circle.targetColor,
            circle.colorTransitionSpeed,
          );

          if (circle.y - circle.diameter / 2 > p.height) {
            toRemove.push(i);
          }
          break;
      }

      p.fill(circle.color);
      p.noStroke();
      let startAngle = p.radians(-90);
      let endAngle = startAngle + p.radians(circle.angle || 360);

      p.arc(
        circle.x,
        circle.y,
        circle.diameter,
        circle.diameter,
        startAngle,
        endAngle,
        p.PIE,
      );
    }

    if (toRemove.length > 0) {
      for (let i = toRemove.length - 1; i >= 0; i--) {
        circles.splice(toRemove[i], 1);
      }
    }

    for (let i = droppedCircles.length - 1; i >= 0; i--) {
      let circle = droppedCircles[i];
      circle.x += circle.vx;
      circle.y += circle.vy;
      circle.vy += circle.gravity;

      if (circle.y - circle.diameter / 2 > p.height) {
        droppedCircles.splice(i, 1);
      }

      p.fill(circle.color);
      p.noStroke();
      p.ellipse(circle.x, circle.y, circle.diameter);
    }
  };

  function moveQueueForward() {
    for (let circle of circles) {
      if (circle.queuePos === 2) {
        circle.queuePos = 1;
        circle.state = "startToQueue";
      } else if (circle.queuePos === 3) {
        circle.queuePos = 2;
        circle.state = "startToQueue";
      }
    }
  }

  function isAnyCircleMoving() {
    return circles.some((circle) => circle.state === "queueToRoundBox");
  }

  function drawElements() {
    p.fill("#e6e6e6");
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(pillPos.x, pillPos.y, 250, 90, 100);

    p.fill("#0b0b0b");
    p.noStroke();
    p.rect(roundedBoxPos.x, roundedBoxPos.y, 90, 90, 20);

    p.fill("#000000");
    p.noStroke();
    p.ellipse(blackCirclePos.x, blackCirclePos.y, 80, 80);

    let buttonOffset = 0;
    if (p.dist(p.mouseX, p.mouseY, buttonPos.x, buttonPos.y) < 40) {
      buttonOffset = 1;
      if (p.mouseIsPressed) {
        buttonOffset = 3;
      }
    }
    p.fill("#e79f00");
    p.noStroke();
    p.ellipse(buttonPos.x + buttonOffset, buttonPos.y + buttonOffset, 80, 80);
  }

  p.mousePressed = () => {
    let d = p.dist(p.mouseX, p.mouseY, buttonPos.x, buttonPos.y);

    if (d < 40) {
      if (countCirclesInQueue() < 3) {
        let queuePos = getAvailableQueuePos();
        if (queuePos !== -1) {
          circles.push({
            x: buttonPos.x,
            y: buttonPos.y,
            diameter: 70,
            angle: 360,
            state: "startToQueue",
            queuePos: queuePos,
            color: p.color("#e79f00"),
            targetColor: p.color("#139c69"),
            colorTransitionSpeed: 1,
          });
        }
      } else {
        circles.push({
          x: buttonPos.x,
          y: buttonPos.y,
          state: "moveRightThenProjectile",
          vx: p.random(-7, -3),
          vy: p.random(-5, 0),
          gravity: 0.5,
          diameter: 70,
          color: p.color("#e79f00"),
          targetColor: p.color("#fe0100"),
          colorTransitionSpeed: 1,
        });
      }
    }
  };

  function getAvailableQueuePos() {
    let usedPositions = circles
      .filter(
        (circle) =>
          circle.state === "startToQueue" || circle.state === "inQueue",
      )
      .map((circle) => circle.queuePos);
    if (!usedPositions.includes(1)) return 1;
    if (!usedPositions.includes(2)) return 2;
    if (!usedPositions.includes(3)) return 3;
    return -1;
  }

  function countCirclesInQueue() {
    return circles.filter(
      (circle) => circle.state === "startToQueue" || circle.state === "inQueue",
    ).length;
  }
}
