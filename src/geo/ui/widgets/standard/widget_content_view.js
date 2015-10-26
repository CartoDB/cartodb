/**
 *  Default widget content view:
 *
 */

cdb.geo.ui.Widget.Content = cdb.core.View.extend({

  className: 'Widget-body',

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
      '</div>'+
      '<dl class="Widget-info">'+
        '<dt class="Widget-infoItem Widget-textSmaller Widget-textSmaller--upper"><%= itemsCount %> items</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content js-content"></div>',

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-list Widget-list--withBorders">' +
      '<li class="Widget-listItem Widget-listItem--withBorders Widget-listItem--fake"></li>' +
    '</ul>',

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var template = _.template(this._TEMPLATE);
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.viewModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    }

    return this;
  },

  _initBinds: function() {
    this.dataModel.once('error', this._onFirstLoad, this);
    this.dataModel.once('change:data', this._onFirstLoad, this);
    this.viewModel.bind('change:sync', this._checkBinds, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onFirstLoad: function() {
    this.render();
    this._unbindEvents(); // Remove any old dataModel binding
    this._checkBinds();
  },

  _checkBinds: function() {
    var isSync = this.viewModel.get('sync');
    this[ isSync ? '_bindEvents' : '_unbindEvents']();
  },

  _bindEvents: function() {
    this.dataModel.bind('change:data', this.render, this);
  },

  _unbindEvents: function() {
    this.dataModel.unbind(null, null, this);
  },

  _addPlaceholder: function() {
    var placeholderTemplate = _.template(this._PLACEHOLDER);
    this.$('.js-content').append(placeholderTemplate());
  }

});
