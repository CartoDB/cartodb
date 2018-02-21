var _ = require('underscore');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var StyleFormComponents = require('builder/editor/style/style-form/style-form-components-dictionary');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'animated',

  parse: function (r, opts) {
    var columnAnimatable = opts.querySchemaModel.columnsCollection.findWhere(function (colModel) {
      return colModel.get('type') === 'number' || colModel.get('type') === 'date';
    });

    return _.extend(
      r,
      {
        attribute: r.attribute || (columnAnimatable && columnAnimatable.get('name')),
        overlap: r.overlap && r.overlap.toString()
      }
    );
  },

  initialize: function (attrs, opts) {
    StyleFormDefaultModel.prototype.initialize.apply(this, arguments);

    this.listenTo(this._styleModel, 'change', this._onStyleChanged);
  },

  _setSchema: function () {
    this.schema = this._generateSchema();
    this.trigger('changeSchema', this);
  },

  _onStyleChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    this.set('overlap', this._isTorqueCategory() ? 'false' : this.get('overlap'));
  },

  _onChange: function () {
    var animatedData = _.extend(
      {},
      this.attributes,
      {
        overlap: this.get('overlap') === 'true'
      }
    );

    // Don't update style model if there is no attribute selected
    if (!animatedData.attribute) {
      return false;
    }

    this._styleModel.set('animated', animatedData);
  },

  _generateSchema: function () {
    var styleType = this._styleModel.get('type');

    if (styleType === 'heatmap') {
      return {
        resolution: StyleFormComponents['animated-resolution']()
      };
    } else {
      return StyleFormDefaultModel.prototype._generateSchema.call(this);
    }
  }
});
