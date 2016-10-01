var Backbone = require('backbone');
var _ = require('underscore');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListCollection = require('../../../custom-list/custom-list-multi-collection');
var selectedItemTemplate = require('./select-item.tpl');
var CustomListItemView = require('../../../custom-list/custom-list-multi-item-view');
var itemListTemplate = require('../../../custom-list/custom-list-item-with-checkbox.tpl');
var template = require('./select.tpl');
var ENTER_KEY_CODE = 13;

Backbone.Form.editors.MultiSelect = Backbone.Form.editors.Base.extend({

  tagName: 'div',
  className: 'u-ellipsis Editor-formSelect',

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

  _getLabel: function () {
    var itemCount = _.compact(this.collection.pluck('selected')).length;
    return _t('components.backbone-forms.select.selected', { count: itemCount });
  },

  _initViews: function () {
    var isLoading = this.options.loading;
    var isEmpty = !this.collection.length;
    var isDisabled = !isEmpty ? this.options.disabled : true;

    this.$el.html(
      template({
        label: this._getLabel(),
        keyAttr: this.options.keyAttr,
        isDisabled: isDisabled,
        isLoading: isLoading,
        isEmpty: isEmpty
      })
    );

    if (isDisabled) {
      this.undelegateEvents();
    }

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this.options.showSearch,
      typeLabel: this.options.keyAttr,
      itemTemplate: this.options.itemListTemplate,
      itemView: this.options.customListItemView
    });

    this._listView.bind('hidden', this._onHide, this);

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
    this._renderButton(mdl).focus();
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

  _getSelectedValues: function () {
    return this.collection.chain().map(function (m) { return m.get('selected') ? m.get('val') : null; }).compact().value();
  },

  getValue: function () {
    var values = this._getSelectedValues();
    if (values.length > 0) {
      return values;
    }
    return;
  },

  setValue: function (value) {
    if (value) {
      var selectedModel = this.collection.setSelected(value);

      if (selectedModel) {
        this._renderButton(selectedModel);
      }
    }
  },

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var data = _.extend({}, mdl.attributes, { label: this._getLabel() });
    var $html = this.options.selectedItemTemplate(data);

    button
      .removeClass('is-empty')
      .html($html);

    return button;
  },

  _onHide: function () {
    if (this._getSelectedValues().length > 0) {
      this.trigger('change', this);
    }
  },

  remove: function () {
    this._listView && this._listView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
