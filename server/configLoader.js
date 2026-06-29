const fs = require("fs");
const path = require("path");

function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Config must be a JSON object");
  }

  if (!Array.isArray(config.names) || config.names.length === 0) {
    throw new Error("Config must include a non-empty names array");
  }

  for (const name of config.names) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Config names must be non-empty strings");
    }
  }

  if (
    config.ipOverrides === undefined ||
    config.ipOverrides === null ||
    typeof config.ipOverrides !== "object" ||
    Array.isArray(config.ipOverrides)
  ) {
    throw new Error("Config must include an ipOverrides object");
  }

  for (const [ip, name] of Object.entries(config.ipOverrides)) {
    if (typeof ip !== "string" || ip.trim() === "") {
      throw new Error("Config ipOverrides keys must be non-empty IP strings");
    }
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error(`Config ipOverrides value for ${ip} must be a non-empty string`);
    }
  }
}

function loadConfig(configPath) {
  if (!configPath || typeof configPath !== "string") {
    throw new Error("CONFIG_PATH is required and must point to chat-config.json");
  }

  const resolvedPath = path.resolve(configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found at ${resolvedPath}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read valid JSON config at ${resolvedPath}: ${error.message}`);
  }

  validateConfig(parsed);

  return {
    names: parsed.names.map((name) => name.trim()),
    ipOverrides: Object.fromEntries(
      Object.entries(parsed.ipOverrides).map(([ip, name]) => [ip.trim(), name.trim()])
    )
  };
}

module.exports = {
  loadConfig
};
