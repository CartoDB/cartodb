var _ = require('underscore');
var camshaftReference = require('../../../../../data/camshaft-reference');
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

  /**
   * @override {BaseAnalysisFormModel._updateNodeDefinition}
   */
  _updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = _.extend(
      this._createSharedSchema(),
      this._typeDef().createSchema()
    );
    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  _createSharedSchema: function () {
    return {
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      type: {
        type: 'Radio',
        text: _t('editor.layers.analysis-form.type'),
        options: [
          {
            val: 'buffer',
            label: _t('editor.layers.analysis-form.distance')
          }, {
            val: 'trade-area',
            label: _t('editor.layers.analysis-form.time')
          }
        ],
        editorAttrs: { disabled: !this._canChangeType() }
      }
    };
  },

  _canChangeType: function () {
    var otherType = this.get('type') === 'buffer' ? 'trade-area' : 'buffer';
    var source = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    return source.isValidAsInputForType(otherType);
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
