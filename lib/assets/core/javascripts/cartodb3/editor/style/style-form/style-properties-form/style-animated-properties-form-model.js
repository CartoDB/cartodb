var _ = require('underscore');
var StyleFormDefaultModel = require('../style-form-default-model');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'animated',

  parse: function (r, opts) {
    var querySchemaModel = opts && opts.querySchemaModel || this._querySchemaModel;
    var styleModel = opts && opts.styleModel || this._styleModel;

    var columnAnimatable = querySchemaModel.columnsCollection.findWhere(function (colModel) {
      return colModel.get('type') === 'number' || colModel.get('type') === 'date';
    });

    var fill = styleModel.get('fill');
    var animationType = styleModel.get('style');
    var color = (fill && fill.color) || {};
    var isTorqueCategory = animationType && !color.fixed;

    if (isTorqueCategory) {
      return _.extend(
        _.omit(r, 'overlap'),
        {
          attribute: r.attribute || (columnAnimatable && columnAnimatable.get('name'))
        }
      );
    } else {
      return _.extend(
        r,
        {
          attribute: r.attribute || (columnAnimatable && columnAnimatable.get('name')),
          overlap: r.overlap && r.overlap.toString()
        }
      );
    }
  },

  initialize: function (attrs, opts) {
    StyleFormDefaultModel.prototype.initialize.apply(this, arguments);

    this._initBinds();
  },

  _initBinds: function () {
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
    var attrs = this.parse(this.attributes);
    this.clear({ silent: true });
    this.set('type', attrs.type, { silent: true }); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
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
