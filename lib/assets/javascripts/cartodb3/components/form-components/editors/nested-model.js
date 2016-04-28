var Backbone = require('backbone');
var _ = require('underscore');
var template = require('./number.tpl');

Backbone.Form.editors.NestedModel = Backbone.Form.editors.NestedModel.extend({

  enabledBy: false,

  initialize: function (opts) {
    this.constructor.__super__.initialize.apply(this, [opts]);
    this.enabledBy = opts.schema.options.enabledBy;
    if (this.enabledBy) {
      this._initBinds();
    }
  },

  _initBinds: function () {
    this.model.bind('change:' + this.enabledBy.key, this._setVisibility, this);
  },

  render: function () {
    this._setVisibility();
    return this.constructor.__super__.render.apply(this, arguments);
  },

  _isVisible: function () {
    if (this.enabledBy) {
      var regexp = new RegExp(this.enabledBy.validation);
      return regexp.test(this.model.get(this.enabledBy.key));
    } else {
      return true;
    }
  },

  _setVisibility: function () {
    this.$el[ this._isVisible() ? 'show' : 'hide' ]();
  }

});
