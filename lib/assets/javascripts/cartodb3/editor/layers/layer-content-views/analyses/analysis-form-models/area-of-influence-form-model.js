var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./area-of-influence-form.tpl');

var AREA_OF_INFLUENCE_TYPES = {
  buffer: require('./area-of-influence-buffer'),
  'trade-area': require('./area-of-influence-trade-area')
};

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();

    this.on('change:type', this._updateSchema, this);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return this._typeDef().templateData;
  },

  _updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._typeDef().toNodeAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  /**
   * @override BaseAnalysisFormModel.prototype._setSchema
   */
  _setSchema: function () {
    var schema = this._typeDef().createSchema(this.attributes);
    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  _updateSchema: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({silent: true});
    this.set('type', attrs.type, {silent: true}); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return AREA_OF_INFLUENCE_TYPES[type];
  }

});
