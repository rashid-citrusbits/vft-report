const { generateSvgs } = require("./main");

module.exports.handler = async (event) => {
  // Parse the event body as JSON
  const requestBody = JSON.parse(event.body);

  // Log GK input data to CloudWatch
  const orders = requestBody.orderLineItems;
  console.log(`🚀 > handler > data:`, orders);

  if (!Array.isArray(orders)) {
    return {
      statusCode: 500,
      body: `Invalid typeof orderLineItems! ${typeof orders}`,
    };
  }

  try {
    const svg = await generateSvgs(orders);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
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
