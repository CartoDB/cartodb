var Backbone = require('backbone');
var _ = require('underscore');
var template = require('./number.tpl');

Backbone.Form.editors.NestedModel = Backbone.Form.editors.NestedModel.extend({

  initialize: function (opts) {
    this._key = opts.key;
    this._enabler = opts.schema.options && opts.schema.options.enabler;
    if (this._enabler) {
      this._initEnabler();
    }
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
    var initialValue = this.model.get(this._key)[this._enabler.attribute];
    this._enablerModel = new Backbone.Model({ enabler: initialValue });
    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: (this._enabler && this._enabler.title) || '',
      key: 'enabler'
    });

    this._enablerModel.bind('change:enabler', function () {
      this._updateEnabledAttribute();
      this._setVisibility();
    }, this);
  },

  _updateEnabledAttribute: function () {
    var value = this._enablerModel.get('enabler');
    var data = this.model.get(this._key);
    data[this._enabler.attribute] = value;
    this.model.set(this._key, data);
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
