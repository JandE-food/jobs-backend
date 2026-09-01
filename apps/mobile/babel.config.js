module.exports = function (api) {
  api.cache(true);

  const fs = require("fs");
  const Module = require("module");
  const path = require("path");
  const originalResolveFilename = Module._resolveFilename;
  const codegenPluginCandidates = [
    path.join(
      __dirname,
      "node_modules",
      "@react-native",
      "babel-plugin-codegen",
      "index.js",
    ),
    path.join(
      __dirname,
      "node_modules",
      "expo",
      "node_modules",
      "@react-native",
      "babel-plugin-codegen",
      "index.js",
    ),
  ];
  const resolvedCodegenPlugin = codegenPluginCandidates.find((candidate) =>
    fs.existsSync(candidate),
  );
  const localExpoPreset = path.join(
    __dirname,
    "node_modules",
    "expo",
    "node_modules",
    "babel-preset-expo",
    "build",
    "index.js",
  );

  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === "@react-native/babel-plugin-codegen" && resolvedCodegenPlugin) {
      return resolvedCodegenPlugin;
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  return {
    presets: [fs.existsSync(localExpoPreset) ? localExpoPreset : "babel-preset-expo"],
  };
};
