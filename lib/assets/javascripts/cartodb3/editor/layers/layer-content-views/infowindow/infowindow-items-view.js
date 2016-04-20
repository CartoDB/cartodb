var cdb = require('cartodb.js');
var template = require('./infowindow-items.tpl');
var Backbone = require('backbone');

/**
 * Select for a Widget definition type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    if (this._widgetFormView) {
      this._widgetFormView.remove();
    }

    this._widgetFormView = new Backbone.Form({
      // model: this._widgetFormModel
    });

    this._widgetFormView.bind('change', function () {
      this.commit();
    });

    this.$('.js-content').html(this._widgetFormView.render().$el);

    return this;
  }

});
