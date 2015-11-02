/**
 *  Default widget error view:
 *
 *  It will listen or not to dataModel changes when
 *  first load is done.
 *
 */

cdb.geo.ui.Widget.Error = cdb.core.View.extend({

  className: 'Widget-error',

  _TEMPLATE: ' ' +
    '<button class="Widget-button Widget-errorButton js-refresh">'+
      '<span class="Widget-textSmall Widget-textSmall--bold">REFRESH</span>' +
    '</button>',

  events: {
    'click .js-refresh': '_onRefreshClick'
  },

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    var template = _.template(this._TEMPLATE);
    this.$el.html(template());
    return this;
  },

  _initBinds: function() {
    this.model.bind('error', this.show, this);
    this.model.bind('loading sync', this.hide, this);
  },

  _onRefreshClick: function() {
    this.model.fetch();
  },

  show: function() {
    this.$el.css('display', 'flex');
    this.$el.addClass('is-visible');
  },

  hide: function() {
    var self = this;
    this.$el.removeClass('is-visible');
    setTimeout(function() {
      self.$el.hide();
    }, 500);
  }

});
