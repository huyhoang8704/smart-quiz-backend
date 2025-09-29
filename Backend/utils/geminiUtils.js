const { GoogleGenerativeAI } = require("@google/generative-ai");

// Function to list available Gemini models
async function listAvailableModels() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("Available Gemini models:");
    if (data.models && data.models.length > 0) {
      data.models.forEach((model) => {
        console.log(
          `- ${model.name}: ${model.displayName || "No display name"}`
        );
        console.log(
          `  Supported methods: ${
            model.supportedGenerationMethods?.join(", ") || "N/A"
          }`
        );
        console.log(`  Input token limit: ${model.inputTokenLimit || "N/A"}`);
        console.log(`  Output token limit: ${model.outputTokenLimit || "N/A"}`);
        console.log("---");
      });
    } else {
      console.log("No models found in response");
    }

    return data.models || [];
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

// Function to get the best available model for quiz generation
async function getBestAvailableModel() {
  const preferredModels = [
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-flash",
  ];

  try {
    const availableModels = await listAvailableModels();

    for (const preferred of preferredModels) {
      const found = availableModels.find((model) => {
        const modelName = model.name.replace("models/", "");
        return (
          modelName === preferred &&
          model.supportedGenerationMethods?.includes("generateContent")
        );
      });

      if (found) {
        const modelName = found.name.replace("models/", "");
        console.log(`Selected model: ${modelName}`);
        return modelName;
      }
    }

    // Fallback to first available model that supports generateContent
    const fallback = availableModels.find((model) =>
      model.supportedGenerationMethods?.includes("generateContent")
    );

    if (fallback) {
      const modelName = fallback.name.replace("models/", "");
      console.log(`Using fallback model: ${modelName}`);
      return modelName;
    }

    throw new Error("No suitable models found for content generation");
  } catch (error) {
    console.error("Error getting best model:", error);
    // Return a default model name as last resort
    console.log("Using default model: gemini-pro");
    return "gemini-pro";
  }
}

// Function to test if a specific model works
async function testModel(modelName) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Say hello" }] }],
    });

    const response = result.response.text();
    console.log(`Model ${modelName} works! Response: ${response}`);
    return true;
  } catch (error) {
    console.log(
      `Model ${modelName} failed: ${error.status} - ${error.message}`
    );
    return false;
  }
}

// Function to find working models
async function findWorkingModels() {
  const modelsToTest = [
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-flash",
    "models/gemini-pro",
    "models/gemini-1.5-pro",
  ];

  console.log("Testing models...");
  const workingModels = [];

  for (const modelName of modelsToTest) {
    const works = await testModel(modelName);
    if (works) {
      workingModels.push(modelName);
    }
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("Working models:", workingModels);
  return workingModels;
}

module.exports = {
  listAvailableModels,
  getBestAvailableModel,
  testModel,
  findWorkingModels,
};
