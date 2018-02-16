var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var _ = require('underscore');
var CustomListView = require('builder/components/custom-list/custom-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-multi-collection');
var selectedItemTemplate = require('./select-item.tpl');
var CustomListItemView = require('builder/components/custom-list/custom-list-multi-item-view');
var itemListTemplate = require('builder/components/custom-list/custom-list-item-with-checkbox.tpl');
var template = require('./select.tpl');
var PopupManager = require('builder/components/popup-manager');

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
    EditorHelpers.setOptions(this, opts);

    this.collection = new CustomListCollection(opts.schema.options);
    this.dialogMode = this.options.dialogMode || 'nested';

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
    var name = this._getLabel();
    var isNull = name === null;
    var label = isNull ? 'null' : name;

    this.$el.html(
      template({
        label: label,
        keyAttr: this.options.keyAttr,
        isDisabled: isDisabled,
        isLoading: isLoading,
        isEmpty: isEmpty,
        isNull: isNull,
        placeholder: null,
        help: this.options.help
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
      itemView: this.options.customListItemView,
      actions: [{
        label: _t('components.backbone-forms.select.none'),
        action: this._deselectAll.bind(this)
      },
      {
        label: _t('components.backbone-forms.select.all'),
        action: this._selectAll.bind(this)
      }],
      searchPlaceholder: 'Search'
    });

    this._listView.bind('hidden', this._onHide, this);

    this._popupManager = new PopupManager(this.cid, this.$el, this._listView.$el);
    this._popupManager.append(this.dialogMode);
  },

  _initBinds: function () {
    var hide = function () {
      this._listView.hide();
      this._popupManager.untrack();
    }.bind(this);

    this.collection.bind('change:selected', _.debounce(this._onItemSelected, 50), this);
    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);
  },

  _selectAll: function () {
    this.collection.each(function (model) {
      model.set('selected', true);
    });
  },

  _deselectAll: function () {
    this.collection.each(function (model) {
      model.set('selected', false);
    });
  },

  _onItemSelected: function (mdl) {
    this._renderButton(mdl).focus();
    this.trigger('change', this);
  },

  _onButtonClick: function (ev) {
    this._listView.toggle();
    this._listView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._listView.isVisible()) {
        ev.stopPropagation();
        this._listView.toggle();
        this._popupManager.track();
      } else {
        this._popupManager.untrack();
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
    this._popupManager && this._popupManager.destroy();
    this._listView && this._listView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
