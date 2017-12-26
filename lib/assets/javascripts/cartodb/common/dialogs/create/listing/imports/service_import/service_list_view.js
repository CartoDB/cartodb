var cdb = require('cartodb.js-v3');
var ServiceListItem = require('./service_list_item_view');
var pluralizeString = require('../../../../../view_helpers/pluralize_string');

/**
 *  Service list view
 *
 *  - It will display all the items available under
 *  the service and the possibility to chose one of
 *  them.
 *
 */

module.exports = cdb.core.View.extend({

  _TEXTS: {
    item: _t('item')
  },

  options: {
    title: 'service',
    fileAttrs: {}
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/service_list');
    this._initBinds();
    this._checkVisibility();
  },

  render: function() {
    this.clearSubViews();
    var size = this.collection.size();
    this.$el.html(
      this.template({
        size: size,
        title: this.options.title,
        pluralize: pluralizeString(this._TEXTS.item, size)
      })
    );
    if (this.collection.size() > 0) {
      this.collection.each(this._addItem, this);
    }
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.model.bind('change:state', this._checkVisibility, this);
    this.add_related_model(this.collection);
  },

  _addItem: function(m) {
    var item = new ServiceListItem({
      model: m,
      title: this.options.title,
      fileAttrs: this.options.fileAttrs
    });
    item.bind('selected', this._onSelectedItem, this);
    this.$('.ServiceList-items').append(item.render().el);
    this.addView(item);
  },

  _onSelectedItem: function(mdl) {
    this.model.set({
      state: 'selected',
      value: mdl.toJSON(),
      service_item_id: mdl.get('id')
    });
  },

  _checkVisibility: function() {
    var state = this.model.get('state');
    if (state === 'list') {
      this.show();
    } else {
      this.hide();
    }
  }

});
