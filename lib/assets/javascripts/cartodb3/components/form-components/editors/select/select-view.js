var Backbone = require('backbone');
var _ = require('underscore');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
var selectedItemTemplate = require('./select-item.tpl');
var CustomListItemView = require('../../../custom-list/custom-list-item-view');
var itemListTemplate = require('../../../custom-list/custom-list-item.tpl');
var template = require('./select.tpl');
var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Select = Backbone.Form.editors.Base.extend({

  tagName: 'div',

  events: {
    'click .js-button': '_onButtonClick',
    'keydown .js-button': '_onButtonKeyDown',
    'focus .js-button': function () {
      this.trigger('focus', this);
    },
    'blur': function () {
      this.trigger('blur', this);
    }
  },

  options: {
    selectedItemTemplate: selectedItemTemplate,
    itemListTemplate: itemListTemplate,
    customListItemView: CustomListItemView
  },

  initialize: function (opts) {
    this.options = _.extend(
      {},
      this.options,
      opts.schema.editorAttrs || {},
      {
        keyAttr: opts.key
      },
      opts
    );

    this.collection = new CustomListCollection(opts.schema.options);
    this._initViews();
    this.setValue(this.model.get(opts.key));
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initBinds();
  },

  _initViews: function () {
    var disabled = this.collection.length > 0 ? this.options.disabled : true;

    this.$el.html(
      template({
        label: this.model.get(this.options.keyAttr),
        keyAttr: this.options.keyAttr,
        disabled: disabled
      })
    );

    if (disabled) {
      this.undelegateEvents();
    }

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this.options.showSearch,
      typeLabel: this.options.keyAttr,
      itemTemplate: this.options.itemListTemplate,
      itemView: this.options.customListItemView
    });

    this.$el.append(this._listView.el); // No render from the beginning
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onItemSelected, this);
    this.applyESCBind(function () {
      this._listView.hide();
    });
    this.applyClickOutsideBind(function () {
      this._listView.hide();
    });
  },

  _onItemSelected: function (mdl) {
    this._listView.hide();
    this._renderButton(mdl).focus();
    this.trigger('change', this);
  },

  _onButtonClick: function (ev) {
    this._listView.toggle();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._listView.isVisible()) {
        ev.stopPropagation();
        this._listView.toggle();
      }
    }
  },

  getValue: function () {
    var item = this.collection.getSelectedItem();
    if (item) {
      return item.getValue();
    }
    return;
  },

  setValue: function (value) {
    var selectedModel = this.collection.setSelected(value);
    if (selectedModel) {
      this._renderButton(selectedModel);
    }
    this.value = value;
  },

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var data = _.extend({}, {label: mdl.getName()}, mdl.attributes);
    var $html = this.options.selectedItemTemplate(data);

    button
      .removeClass('is-empty')
      .html($html);

    return button;
  },

  remove: function () {
    this._listView && this._listView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
