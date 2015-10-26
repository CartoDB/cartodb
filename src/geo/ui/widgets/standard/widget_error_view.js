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
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function() {
    var template = _.template(this._TEMPLATE);
    this.$el.html(template());
    return this;
  },

  _initBinds: function() {
    this.dataModel.once('error', function() {
      this.show();
      this._onFirstLoad();
    }, this);
    this.dataModel.once('change:data', this._onFirstLoad, this);
    this.viewModel.bind('change:sync', this._checkBinds, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onFirstLoad: function() {
    this._unbindEvents(); // Remove any old dataModel binding
    this._checkBinds();
  },

  _checkBinds: function() {
    var isSync = this.viewModel.get('sync');
    this[ isSync ? '_bindEvents' : '_unbindEvents']();
  },

  _bindEvents: function() {
    this.dataModel.bind('error', this.show, this);
    this.dataModel.bind('loading change:data', this.hide, this);
  },

  _unbindEvents: function() {
    this.dataModel.unbind(null, null, this);
  },

  _onRefreshClick: function() {
    this.trigger('refreshData', this);
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
