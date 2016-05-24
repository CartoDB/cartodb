var cdb = require('cartodb.js');
var ServiceListItemView = require('./import-service-list-item-view');
var template = require('./import-service-list.tpl');

/**
 *  Service list view
 *
 *  - It will display all the items available under
 *  the service and the possibility to chose one of
 *  them.
 *
 */

module.exports = cdb.core.View.extend({
  options: {
    title: 'service',
    fileAttrs: {}
  },

  initialize: function () {
    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    this.clearSubViews();
    var size = this.collection.size();
    this.$el.html(
      template({
        size: size,
        title: this.options.title,
        pluralize: _t('components.modals.add-layer.imports.item-pluralize', { smart_count: size })
      })
    );
    if (this.collection.size() > 0) {
      this.collection.each(this._addItem, this);
    }
    return this;
  },

  _initBinds: function () {
    this.collection.bind('sync', this.render, this);
    this.model.bind('change:state', this._checkVisibility, this);
    this.add_related_model(this.collection);
  },

  _addItem: function (m) {
    var item = new ServiceListItemView({
      model: m,
      title: this.options.title,
      fileAttrs: this.options.fileAttrs
    });
    item.bind('selected', this._onSelectedItem, this);
    this.$('.ServiceList-items').append(item.render().el);
    this.addView(item);
  },

  _onSelectedItem: function (mdl) {
    this.model.setUpload({
      state: 'selected',
      value: mdl.toJSON(),
      service_item_id: mdl.get('id')
    });
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    if (state === 'list') {
      this.show();
    } else {
      this.hide();
    }
  }

});
