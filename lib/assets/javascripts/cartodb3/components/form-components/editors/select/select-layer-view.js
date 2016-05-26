var Backbone = require('backbone');
var CustomListView = require('../../../custom-list/custom-view');
var template = require('./select.tpl');
var itemTemplate = require('./select-layer-item.tpl');
var buttonTemplate = require('./select-layer-button.tpl');

Backbone.Form.editors.SelectLayer = Backbone.Form.editors.Select.extend({

  initialize: function (opts) {
    Backbone.Form.editors.Select.prototype.initialize.call(this, opts);
  },

  _initViews: function () {
    this.$el.html(
      template({
        name: this.model.get(this.options.keyAttr),
        keyAttr: this.options.keyAttr,
        disabled: this.options.disabled
      })
    );

    if (this.options.disabled) {
      this.undelegateEvents();
    }

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this.options.showSearch || false,
      itemTemplate: itemTemplate,
      typeLabel: this.options.keyAttr
    });

    this.$el.append(this._listView.el); // No render from the beginning
  },

  _renderButton: function (value) {
    // We are getting the first letter to render the icon
    // in some tests, the model has analyses definition model has no id property.
    if (!value) {
      value = '';
    }
    var button = this.$('.js-button');
    var $html = buttonTemplate({
      name: value
    });

    button
      .removeClass('is-empty')
      .html($html);

    return button;
  }

});
