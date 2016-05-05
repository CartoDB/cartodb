var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.styleModel) throw new Error('Style model is required');
    this._styleModel = opts.styleModel;
    this.schema = this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
    this.bind('change', function () {
      console.log(this.changed);
    }, this);
  },

  _onChange: function () {
    this._styleModel.set(this.changed);
  },

  _generateSchema: function () {
    var schema = {
      // fill: StyleFormComponents['fill'],
      // stroke: StyleFormComponents['stroke'],
      labels: {
        type: 'NestedModel',
        model: this._getNestedLabelsModel(),
        options: {
          enabler: {
            attribute: 'enabled',
            title: _t('editor.style.components.labels-enabled')
          }
        }
      }
    };

    if (this.get('animated')) {
      schema['animated'] = {
        type: 'NestedModel',
        model: this._getNestedAnimatedModel(),
        options: {
          enabler: {
            attribute: 'enabled',
            title: _t('editor.style.components.animated-enabled')
          }
        }
      };
    }

    return schema;
  },

  _getNestedLabelsModel: function () {
    return cdb.core.Model.extend({
      schema: function () {
        return _.reduce(this.attributes, function (memo, value, key) {
          var d = StyleFormComponents['labels-' + key];
          if (d) {
            memo[key] = d;
          }
          return memo;
        }, {});
      }
    });
  },

  _getNestedAnimatedModel: function () {
    return cdb.core.Model.extend({
      schema: function () {
        return _.reduce(this.attributes, function (memo, value, key) {
          var d = StyleFormComponents['animated-' + key];
          if (d) {
            memo[key] = d;
          }
          return memo;
        }, {});
      }
    });
  }

});
