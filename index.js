const { generateSvg } = require("./main");

module.exports.handler = async (event) => {
  // Parse the event body as JSON
  const requestBody = JSON.parse(event.body);

  // Log GK input data to CloudWatch
  const report = requestBody.report;

  console.log(`🚀 > handler > data:`, report);

  try {
    console.time("svg");
    const svg = await generateSvg({ report });
    console.timeEnd("svg");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/svg+xml",
      },
      body: svg,
    };
  } catch (error) {
    console.log(`🚀 > module.exports.handler= > error:`, error);
  }

  console.log("Something went wrong");

  return {
    statusCode: 500,
    body: "Something went wrong!",
  };
};
