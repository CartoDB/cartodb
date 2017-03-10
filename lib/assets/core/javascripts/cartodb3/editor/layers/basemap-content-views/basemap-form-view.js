var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./basemap-form.tpl');
var BasemapFormModel = require('./basemap-form-model');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._disabled = opts.disabled;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();

    return this;
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    var color = {
      color: {
        fixed: '',
        opacity: 1
      }
    };

    if (typeof this.model.get('color') === 'string') {
      color.color.fixed = this.model.get('color');
    }

    this._formModel = new BasemapFormModel({
      color: color,
      image: this.model.get('image') || ''
    }, {
      basemapsCollection: this._basemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      disabled: this._disabled
    });

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-form').append(this._formView.render().$el);
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }

});
