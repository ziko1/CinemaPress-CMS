/**
 * Universal No-Code CMS
 * Головний файл експорту
 */

const CMSEngine = require('./core/engine');
const SchemaBuilder = require('./core/schema-builder');
const FieldTypes = require('./core/field-types');
const PluginSystem = require('./core/plugin-system');
const LocalizationSystem = require('./core/localization');

// Factory function для створення CMS інстансу
function createCMS(config = {}) {
  return new CMSEngine(config);
}

// Експорт основних класів
module.exports = {
  createCMS,
  CMSEngine,
  SchemaBuilder,
  FieldTypes,
  PluginSystem,
  LocalizationSystem,
  
  // Helper для швидкого старту
  async start(config) {
    const cms = createCMS(config);
    await cms.init();
    return cms;
  }
};
