var cdb = require('cartodb.js');
var template = require('./widget-error-template.tpl');

/**
 *  Default widget error view:
 *
 *  It will listen or not to dataModel changes when
 *  first load is done.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-error is-hidden',

  events: {
    'click .js-refresh': '_onRefreshClick'
  },

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    if (this.model.dataviewModel) {
      this.$el.html(template());
    } else {
      this.$el.empty();
    }
    return this;
  },

  _initBinds: function () {
    var m = this.model.dataviewModel;
    if (m) {
      m.bind('error', this.show, this);
      m.bind('loading', this.hide, this);
      this.add_related_model(m);
    }
  },

  _onRefreshClick: function () {
    this.model.dataviewModel.refresh();
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }

});
