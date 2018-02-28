var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var template = require('./lazy-select.tpl');
var selectedItemTemplate = require('./lazy-select-item.tpl');
var ListView = require('./lazy-list-view');
var PopupManager = require('builder/components/popup-manager');
var SearchCollection = require('./lazy-search-collection');

var ENTER_KEY_CODE = 13;

Backbone.Form.editors.LazySelect = Backbone.Form.editors.Base.extend({

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
    selectedItemTemplate: selectedItemTemplate
  },

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    this.template = options.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';

    var fetchOptions = {
      configModel: this.options.configModel,
      nodeDefModel: this.options.nodeDefModel,
      rowModel: this.model,
      column: this.options.column
    };

    if (this.options.options != null) {
      this.searchCollection = new SearchCollection(this.options.options, fetchOptions);
    } else {
      this.searchCollection = this.options.collection;
    }

    this._initBinds();

    var value = this.model.get(this.options.keyAttr);
    if (value != null) {
      this.setValue(value);
    }

    var lazySearch = function (search) {
      this.searchCollection.fetch(search);
    }.bind(this);
    var type = this.model.get(this.options.column);

    this._listView = new ListView({
      configModel: this.options.configModel,
      searchCollection: this.searchCollection,
      lazySearch: lazySearch,
      type: type,
      searchPlaceholder: this.options.searchPlaceholder
    });
  },

  render: function () {
    var isEmpty = !this.searchCollection.length;
    var isDisabled = this.options.disabled;
    var name = this.model.get(this.options.keyAttr);
    var placeholder = this._getPlaceholder();
    var isNull = this._hasValue();
    var label = isNull ? placeholder : name;
    var title = name || '';

    this.$el.html(
      this.template({
        title: title,
        label: label,
        keyAttr: this.options.keyAttr,
        isEmpty: isEmpty,
        isDisabled: isDisabled,
        isNull: isNull
      })
    );

    this._popupManager = new PopupManager(this.cid, this.$el, this._listView.$el);
    this._popupManager.append(this.dialogMode);

    return this;
  },

  _initBinds: function () {
    var hide = function () {
      this._listView.hide();
      this._popupManager && this._popupManager.untrack();
    }.bind(this);

    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);

    this.listenTo(this.searchCollection, 'change:selected', this._onItemSelected);
  },

  _destroyBinds: function () {
    this.stopListening(this.searchCollection);
    Backbone.Form.editors.Base.prototype._destroyBinds.call(this);
  },

  _getPlaceholder: function (isDisabled) {
    var keyAttr = this.options.keyAttr;
    var placeholder = this.options.placeholder || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr });
    return placeholder;
  },

  _hasValue: function () {
    var name = this.model.get(this.options.keyAttr);
    return name == null || name === '';
  },

  _onItemSelected: function (model) {
    this._listView.hide();
    this._popupManager.untrack();
    this._renderButton(model).focus();

    this.trigger('change', this);
  },

  _onButtonClick: function () {
    this._listView.toggle();
    this._listView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._listView.isVisible()) {
        ev.stopPropagation();
        this._onButtonClick();
      } else {
        this._popupManager.track();
      }
    }
  },

  focus: function () {
    this.$('.js-button').focus();
  },

  blur: function () {
    this.$('.js-button').blur();
  },

  getValue: function () {
    var item = this.searchCollection.getSelectedItem();
    if (item) {
      return item.getValue();
    } else {
      return this.value;
    }
  },

  setValue: function (value) {
    var selectedModel = this.searchCollection.getSelectedItem();
    if (selectedModel) {
      this._renderButton(selectedModel);
    } else {
      this._renderButton(value);
    }
    this.value = value;
  },

  _renderButton: function (model) {
    var button = this.$('.js-button');
    var label = model.getName && model.getName() || model;
    var $html = this.options.selectedItemTemplate({
      label: label
    });

    button
      .toggleClass('is-empty', label === '')
      .attr('title', label)
      .html($html);

    return button;
  },

  remove: function () {
    this._popupManager && this._popupManager.destroy();
    this._listView && this._listView.clean();
    this._destroyBinds();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
