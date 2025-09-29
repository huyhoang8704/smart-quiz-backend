const { GoogleGenerativeAI } = require("@google/generative-ai");

// Function to list available Gemini models
async function listAvailableModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Available Gemini models:");
    data.models?.forEach((model) => {
      console.log(`- ${model.name}: ${model.displayName}`);
      console.log(
        `  Supported methods: ${
          model.supportedGenerationMethods?.join(", ") || "N/A"
        }`
      );
    });

    return data.models;
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

// Function to get the best available model for quiz generation
async function getBestAvailableModel() {
  const preferredModels = [
    "models/gemini-1.5-pro",
    "models/gemini-pro",
    "models/gemini-1.5-flash-latest",
    "models/gemini-flash",
  ];

  try {
    const availableModels = await listAvailableModels();

    for (const preferred of preferredModels) {
      const found = availableModels.find(
        (model) =>
          model.name === preferred &&
          model.supportedGenerationMethods?.includes("generateContent")
      );

      if (found) {
        console.log(`Selected model: ${found.name}`);
        return found.name.replace("models/", ""); // Remove "models/" prefix
      }
    }

    // Fallback to first available model that supports generateContent
    const fallback = availableModels.find((model) =>
      model.supportedGenerationMethods?.includes("generateContent")
    );

    if (fallback) {
      console.log(`Using fallback model: ${fallback.name}`);
      return fallback.name.replace("models/", "");
    }

    throw new Error("No suitable models found for content generation");
  } catch (error) {
    console.error("Error getting best model:", error);
    // Return a default model name as last resort
    return "gemini-pro";
  }
}

module.exports = {
  listAvailableModels,
  getBestAvailableModel,
};
