const queryModelHistory = async (args, _extra) => {
  const records = [];
  const models = records
    .map((record) => {
      try {
        return JSON.parse(record.modelJson);
      } catch (error) {
        console.warn("[MCP] Failed to parse model history JSON", error);
        return null;
      }
    })
    .filter((model) => !!model);
  return models;
};

module.exports = { queryModelHistory };