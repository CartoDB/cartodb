var cdb = require('cartodb-deep-insights.js');

/**
 * Model for general frontend configuration.
 * Ported from old cdb.config, since we can't reuse the older model that's tied to v3 of cartodb.js
 *
 * Also, rather than putting it as a global object, it's intended to be instantiated at the entry point and passed as
 * a collaborator object the models that needs it, e.g.:
 * var myModel = new MyModel({ id: 123, … }, {
 *   configModel: configModel
 * })
 */
module.exports = cdb.core.Model.extend({
  apiUrlVersion: function (modelName, method, defaultVersion) {
    method = method || '';
    var version = this.get(modelName + '_' + method + '_url_version');
    return version || defaultVersion || 'v1';
  }
});
