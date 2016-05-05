var Backbone = require('backbone');
var _ = require('underscore');
var template = require('./number.tpl');

Backbone.Form.editors.NestedModel = Backbone.Form.editors.NestedModel.extend({

  initialize: function (opts) {
    this._initEnabler();
    this.constructor.__super__.initialize.apply(this, [opts]);
  },

  render: function () {
    this.constructor.__super__.render.apply(this, arguments);
    this.$('form').addClass('Editor-formInner--nested');
    this.$el.prepend(this._enablerView.render().el);
    this._setVisibility();
    return this;
  },

  _initEnabler: function () {
    this._enablerModel = new Backbone.Model({ enabler: false });
    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: 'hello',
      key: 'enabler'
    });

    this._enablerModel.bind('change:enabler', this._setVisibility, this);
  },

  _destroyEnabler: function () {
    this._enablerView.remove();
    this._enablerModel.unbind(null, null, this);
  },

  _isVisible: function () {
    return this._enablerModel.get('enabler');
  },

  _setVisibility: function () {
    this.$('form')[ this._isVisible() ? 'show' : 'hide' ]();
  },

  remove: function () {
    this._destroyEnabler();
    this.constructor.__super__.remove.apply(this);
  }

});
