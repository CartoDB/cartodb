/**
 *  Default widget loader view:
 *
 *  It will listen or not to dataModel changes when
 *  first load is done.
 *
 */

cdb.geo.ui.Widget.Loader = cdb.core.View.extend({

  className: 'Widget-loader',

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  _initBinds: function() {
    this.dataModel.once('loading', this.show, this);
    this.dataModel.once('error', this._onFirstLoad, this);
    this.dataModel.once('change:data', this._onFirstLoad, this);
    this.viewModel.bind('change:sync', this._checkBinds, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onFirstLoad: function() {
    this.hide();
    this._unbindEvents(); // Remove any old dataModel binding
    this._checkBinds();
  },

  _checkBinds: function() {
    var isSync = this.viewModel.get('sync');
    this[ isSync ? '_bindEvents' : '_unbindEvents']();
  },

  _bindEvents: function() {
    this.dataModel.bind('error change:data', this.hide, this);
    this.dataModel.bind('loading', this.show, this);
  },

  _unbindEvents: function() {
    this.dataModel.unbind(null, null, this);
  },

  show: function() {
    this.$el.addClass('is-visible');
  },

  hide: function() {
    this.$el.removeClass('is-visible');
  }

});
