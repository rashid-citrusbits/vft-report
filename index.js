const { generateSvg } = require("./main");

module.exports.handler = async (event) => {
  // Check if the request method is POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  // Parse the event body as JSON
  const requestBody = JSON.parse(event.body);

  // Log GK input data to CloudWatch
  const report = requestBody.report;

  console.log(`🚀 > handler > data:`, report);

  try {
    const svg = generateSvg({ report });

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

  return {
    statusCode: 500,
    body: "Something went wrong!",
  };
};
