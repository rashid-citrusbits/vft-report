import { generateSvg } from "./main.js";

export const handler = async (event) => {
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

  generateSvg({ report });
};
