// eslint-disable-next-line
const canvas = require("canvas"); // workaround for lambda node-canvas layer
const { PaperScope } = require("paper-jsdom-canvas");
const { boundaries, deviationSlabs, humphreySlabs } = require("./boundaries");
const { radiusLogo, deviationImages, humphreyImages } = require("./consts");
// const fs = require("fs");

const generateSvgs = async (orders) => {
  const svgs = await Promise.all(
    orders.map((order, i) => generateSvg(order, i))
  );

  return svgs.reduce((acc, item) => ({ ...acc, ...item }), {});
};

const generateSvg = async (order, i) => {
  console.time("single-svg-" + i);
  const paper = new PaperScope();
  paper.setup(new paper.Size(1100, (1100 / 8) * 12));
  // ABOVE REPORT

  // await generateReport(paper, order);

  // BELOW REPORT
  const svgContent = paper.project.exportSVG({ asString: true });
  // fs.writeFileSync(`report-${i + 1}.svg`, svgContent, "utf8");
  paper.project.clear();

  console.timeEnd("single-svg-" + i);

  return { [order.id]: svgContent };
};

/**
 * @param {import('paper').PaperScope} paper
 * @param {Object} order
 */
const generateReport = async (paper, order) => {
  // prettier-ignore
  const trialResults = order.VFTResult.trialResults.results.map(r => ({ x: Number(String(r.degH).trim())+30, y: 30-Number(String(r.degV).trim()), value: String(r.sensitivityDB).trim() }))
  // prettier-ignore
  const patternDeviation = order.VFTResult.deviationResults.map(r => ({ x: Number(String(r.degH).trim())+30, y: 30-Number(String(r.degV).trim()), value: Number(String(r.patDev).trim()) }))
  // prettier-ignore
  const totalDeviation = order.VFTResult.deviationResults.map(r => ({ x: Number(String(r.degH).trim())+30, y: 30-Number(String(r.degV).trim()), value: Number(String(r.totalDev).trim()) }))
  // prettier-ignore
  const totalDeviationGray = order.VFTResult.deviationResults.map(r => ({ x: Number(String(r.degH).trim()) + 30, y: 30 - Number(String(r.degV).trim()), value: Number(String(r.totalGray).trim()) }))
  // prettier-ignore
  const patternDeviationGray = order.VFTResult.deviationResults.map(r => ({ x: Number(String(r.degH).trim()) + 30, y: 30 - Number(String(r.degV).trim()), value: Number(String(r.patGray).trim()) }))

  const interpolatedResults = order.VFTResult.interpolatedResults;

  let interpolation = interpolatedResults.interpolatedData
    .flatMap((row, rI) =>
      row.map((cell, cI) => ({
        x: interpolatedResults.degH[cI] + 30,
        y: 30 - interpolatedResults.degV[rI],
        value: Math.round(cell),
      }))
    )
    .filter((v) => v.value !== 500);
  // .filter((v) => v.value !== 0)

  // console.log(JSON.stringify(interpolation.filter((r) => r.value === 0)));

  if (order.chartType === "24-2") {
    interpolation = interpolation.filter(
      (i) => boundaries[order.chartType][order.occula][`${i.x},${i.y}`] !== true
    );
  }
  if (order.chartType === "10-2") {
    interpolation = interpolation.filter(
      (i) => boundaries[order.chartType][`${i.x},${i.y}`] !== true
    );
  }

  const totalPixels = 60;
  const scale = 6;

  let textChartScale = 6;
  let imageChartScale = 6;
  let imageChartOffset = 0;
  let textChartOffset = 0;
  let axisLabel = "30";

  if (String(order.chartType || "").trim() === "10-2") {
    textChartScale = 18;
    imageChartScale = 12;
    imageChartOffset = 180;
    textChartOffset = 360;
    axisText = "10";
  }

  const chartsRow1 = 65 * scale;
  const chartsRow2 = 135 * scale;
  const chartsRow3 = 205 * scale;
  const chartsCol1 = 10 * scale;
  const chartsCol2 = 80 * scale;
  const axisLabelLeft = 3 * scale;
  const axisLabelRight = 63 * scale;
  const axisLabelFontSize = 0.4 * scale;
  const rectangleWidth = 170;
  const backgroundColor = "#efefef";
  const axisColor = "#aaa";

  await new Promise((resolve, reject) => {
    const logo = new paper.Raster(radiusLogo);
    logo.onLoad = () => {
      logo.position = { x: 160 * scale, y: 5 * scale };
      logo.size = new paper.Size(20 * scale, 8 * scale);
      resolve();
    };
  });

  const drawChart = async (placement, chart) => {
    const { x: startX, y: startY, size: totalPixels, scale } = placement;
    const { points, type, slabs, images, showAxisLabel } = chart;

    const drawBackground = () => {
      new paper.Path.Rectangle({
        point: [startX, startY],
        size: totalPixels * scale,
        fillColor: backgroundColor,
      });
    };

    const drawAxis = () => {
      const strokeWidth = 2;

      var xAxis = new paper.Path();
      xAxis.add({
        x: startX + 0, //
        y: startY + (totalPixels * scale) / 2,
      });
      xAxis.add({
        x: startX + totalPixels * scale,
        y: startY + (totalPixels * scale) / 2,
      });
      xAxis.strokeColor = axisColor;
      xAxis.strokeWidth = strokeWidth;

      const axisBars = [0, 10, 20, 30, 40, 50, 60];
      axisBars.forEach((bar) => {
        var xAxisBar = new paper.Path();
        xAxisBar.add({
          x: startX + bar * scale,
          y: startY + (totalPixels / 2 - 1) * scale,
        });
        xAxisBar.add({
          x: startX + bar * scale,
          y: startY + (totalPixels / 2 + 1) * scale,
        });
        xAxisBar.strokeColor = axisColor;
        xAxisBar.strokeWidth = strokeWidth;
      });

      var yAxis = new paper.Path();
      yAxis.add({ y: startY + 0, x: startX + (totalPixels * scale) / 2 });
      yAxis.add({
        y: startY + totalPixels * scale,
        x: startX + (totalPixels * scale) / 2,
      });
      yAxis.strokeColor = axisColor;
      yAxis.strokeWidth = strokeWidth;

      axisBars.forEach((bar) => {
        var yAxisBar = new paper.Path();
        yAxisBar.add({
          y: startY + bar * scale,
          x: startX + (totalPixels / 2 - 1) * scale,
        });
        yAxisBar.add({
          y: startY + bar * scale,
          x: startX + (totalPixels / 2 + 1) * scale,
        });
        yAxisBar.strokeColor = axisColor;
        yAxisBar.strokeWidth = strokeWidth;
      });

      if (showAxisLabel) {
        new paper.PointText({
          content: axisLabel,
          point: [
            showAxisLabel === "left"
              ? startX - axisLabelLeft
              : startX + axisLabelRight,
            startY + (totalPixels / 2 + 1) * scale - 2,
          ],
          justification: "center",
          fillColor: axisColor,
          fontSize: axisLabelFontSize * scale,
          fontFamily: "monospace",
          fontWeight: "bold",
        });
      }
    };

    const drawTextPoints = (points) => {
      points.forEach((point) => {
        var text = new paper.PointText({
          content: point.value,
          point: [
            startX + point.x * textChartScale - textChartOffset,
            -textChartOffset + startY + point.y * (textChartScale + 0.1),
          ],
          justification: "center",
          fillColor: "black",
          fontSize: 2 * scale,
          fontFamily: "monospace",
          fontWeight: "bold",
        });
      });
    };

    const drawDeviationPoints = async (points) => {
      let i = 0;
      for (const point of points) {
        i++;
        for (const slab of slabs) {
          if (point.value >= slab) {
            // point.image = images[slab];
            point.slab = slab;
            break;
          }
        }

        if (!images.imported) {
          images.imported = {};
        }

        const image = images[point.slab];

        if (image) {
          const position = [
            startX + point.x * imageChartScale - imageChartOffset,
            -imageChartOffset + startY + point.y * imageChartScale,
          ];

          const item = await new Promise((resolve, reject) => {
            paper.project.importSVG(image, function (item) {
              resolve(item);
            });
          });
          item.position = position;
          item.size = new paper.Size(scale, scale);
        }
      }
    };

    // drawBackground();
    drawAxis();
    if (type === "textChart") {
      drawTextPoints(points);
    } else if (type === "deviation") {
      await drawDeviationPoints(points);
    }
  };

  const getReliabilityValue = (str) => {
    try {
      const splitted = str.split(":");

      if (splitted.length !== 3) {
        return "";
      }

      return splitted[1].trim().replace(/ /g, "");
    } catch (error) {
      return "";
    }
  };

  await drawChart(
    { x: chartsCol1, y: chartsRow1, size: totalPixels, scale },
    { points: trialResults, type: "textChart", showAxisLabel: "left" }
  );
  await drawChart(
    { x: chartsCol1, y: chartsRow2, size: totalPixels, scale },
    { points: totalDeviation, type: "textChart" }
  );
  await drawChart(
    { x: chartsCol2, y: chartsRow2, size: totalPixels, scale },
    { points: patternDeviation, type: "textChart" }
  );
  await drawChart(
    { x: chartsCol1, y: chartsRow3, size: totalPixels, scale },
    {
      points: totalDeviationGray,
      type: "deviation",
      slabs: deviationSlabs,
      images: deviationImages,
    }
  );
  await drawChart(
    { x: chartsCol2, y: chartsRow3, size: totalPixels, scale },
    {
      points: patternDeviationGray,
      type: "deviation",
      slabs: deviationSlabs,
      images: deviationImages,
    }
  );
  await drawChart(
    { x: chartsCol2, y: chartsRow1, size: totalPixels, scale },
    {
      points: interpolation,
      type: "deviation",
      slabs: humphreySlabs,
      images: humphreyImages,
      showAxisLabel: "right",
    }
  );

  new paper.Path.Rectangle({
    point: [3 * scale, 15 * scale],
    size: [rectangleWidth * scale, 11 * scale],
    strokeColor: axisColor,
    radius: 10,
  });

  const texts = [
    {
      content: "Visual Field Test - " + order.occula,
      point: [5, 5],
      fontSize: 4,
    },

    {
      content: "Single Field Analysis",
      point: [5, 12],
    },

    {
      content:
        "Eye: " +
        (order.occula.trim().toUpperCase() === "OD" ? "Right" : "Left"),
      point: [120, 12],
    },

    {
      content: String("Name: ")
        .concat(order?.patient?.lastName || "")
        .concat(", ")
        .concat(order?.patient?.firstName || ""),
      point: [5, 19],
    },
    {
      content: String("Patient ID: ").concat(order?.patient?.ehrID || "N/A"),
      point: [5, 23],
    },
    {
      content: String("DOB: ").concat(order?.patient?.dateofBirth || "-"),
      point: [120, 19],
    },
    {
      content: order.chartType + " Threshold Test",
      point: [5, 32],
    },
    {
      content: "Fixation Monitor: Blind Spot",
      point: [5, 39],
    },
    {
      content: "Fixation Target: Central",
      point: [5, 43],
    },
    {
      content:
        "Fixation Losses: " +
        getReliabilityValue(order.VFTResult.reliabilityIndices.FL),
      point: [5, 47],
    },
    {
      content:
        "False POS Errors: " +
        getReliabilityValue(order.VFTResult.reliabilityIndices.FP),
      point: [5, 51],
    },
    {
      content:
        "False NEG Errors: " +
        getReliabilityValue(order.VFTResult.reliabilityIndices.FN),
      point: [5, 55],
    },
    {
      content: "Test Duration: " + order.VFTResult.testResultTime,
      point: [5, 59],
    },
    {
      content: "Stimulus: III, White",
      point: [70, 39],
    },
    {
      content: "Background: 31.5 ASB",
      point: [70, 43],
    },
    {
      content:
        "Strategy: " + order.VFTResult.testStrategy === "Fast"
          ? "RATA Fast"
          : "RATA Standard",
      point: [70, 47],
    },
    {
      content:
        "Date: " +
        new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(order.patientResponseAt)
        ),
      point: [120, 39],
    },
    {
      content:
        "Time: " +
        new Intl.DateTimeFormat("en-US", { timeStyle: "medium" }).format(
          new Date(order.patientResponseAt)
        ),
      point: [120, 43],
    },
    {
      content: String("Age: ").concat(order?.patient?.age || "N/A"),
      point: [120, 47],
    },
    {
      content: "VFI: " + order.VFTResult.diagnosticIndices.VFI,
      point: [140, 114],
    },
    {
      content: order.VFTResult.diagnosticIndices.MDValue,
      point: [140, 118],
    },
    {
      content: "PSD:" + order.VFTResult.diagnosticIndices.PSD,
      point: [140, 122],
    },
  ];

  texts.forEach((text) => {
    new paper.PointText({
      point: [text.point[0] * scale, text.point[1] * scale],
      content: text.content,
      fontSize: (text.fontSize || 2.2) * scale,
    });
  });
};

module.exports = { generateSvgs };
