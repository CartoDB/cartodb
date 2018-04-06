var $ = require('jquery');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var _ = require('underscore');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var selectedItemTemplate = require('./select-item.tpl');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var itemListTemplate = require('builder/components/custom-list/custom-list-item.tpl');
var template = require('./select.tpl');
var PopupManager = require('builder/components/popup-manager');
var SelectListView = require('./select-list-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Select = Backbone.Form.editors.Base.extend({

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
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.template = opts.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';

    if (this.options.mouseOverAction) {
      this._mouseOverAction = this.options.mouseOverAction;
    }

    if (this.options.mouseOutAction) {
      this._mouseOutAction = this.options.mouseOutAction;
    }

    if (this.options.editorAttrs && this.options.editorAttrs.help) {
      this._help = this.options.editorAttrs.help;
    }

    if (this.options.options != null) {
      this.collection = new CustomListCollection(this.options.options);
    } else {
      this.collection = this.options.collection;
    }

    if (this.collection.isAsync === undefined) {
      throw new Error('collection must implement isAsync method.');
    }

    this._initViews();

    this.setValue(this.model.get(this.options.keyAttr));

    this._initBinds();
  },

  render: function () {
    var isEmpty = !this.collection.length;
    var isNull = !this._hasValue();
    this._isDisabled = !isEmpty ? this.options.disabled : true;
    var placeholder = this._getPlaceholder(this._isDisabled);
    var label = isNull ? placeholder : this._getLabel();
    var isLoading = this._isLoading();

    this.$el.html(this.template({
      keyAttr: this.options.keyAttr,
      isEmpty: isEmpty,
      label: label,
      isDisabled: this._isDisabled,
      isNull: isNull,
      isLoading: isLoading,
      help: this._help || ''
    }));

    // we are replacing the html, so we need to re append if nested mode
    if (this.dialogMode === 'nested') {
      this._popupManager.append(this.dialogMode);
    }

    if (!isLoading) {
      this._renderSelected();
    }

    return this;
  },

  _initBinds: function () {
    var hide = function () {
      this._listView.hide();
      this._popupManager.untrack();
      this._onToggleSelected();
    }.bind(this);

    this.applyESCBind(hide);

    this.listenTo(this.collection, 'change:selected', this._onItemSelected);
    this.listenTo(this._listView, 'change:visible', this._onToggleSelected);

    if (this.collection.isAsync()) {
      this.listenTo(this.collection.stateModel, 'change:state', this.render);
    }
  },

  _initViews: function () {
    this._listView = new SelectListView({
      collection: this.collection,
      showSearch: this.options.showSearch,
      allowFreeTextInput: this.options.allowFreeTextInput,
      typeLabel: this.options.keyAttr,
      itemTemplate: this.options.itemListTemplate,
      itemView: this.options.customListItemView,
      position: this.options.position,
      searchPlaceholder: this.options.searchPlaceholder,
      selectModel: this.options.defaultValue && this.model,
      mouseOverAction: this._mouseOverAction,
      mouseOutAction: this._mouseOutAction
    });

    this._popupManager = new PopupManager(this.cid, this.$el, this._listView.$el);
    this._popupManager.append(this.dialogMode);
  },

  _getPlaceholder: function (isDisabled) {
    var keyAttr = this.options.keyAttr;
    var placeholder;

    if (isDisabled) {
      placeholder = this.options.disabledPlaceholder || _t('components.backbone-forms.select.disabled-placeholder', { keyAttr: keyAttr });
    } else {
      placeholder = this.options.placeholder || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr });
    }

    return placeholder;
  },

  _hasValue: function () {
    var name = this.model.get(this.options.keyAttr);
    return name != null && name !== '';
  },

  _getLabel: function () {
    var name = this.model.get(this.options.keyAttr);
    var mdl = this.collection.findWhere({val: name});
    return mdl && mdl.getName() || name || '';
  },

  _isLoading: function () {
    var isLoading = this.options.loading;

    if (this.collection.isAsync()) {
      isLoading = this.collection.stateModel.get('state') === 'fetching';
    }

    return isLoading;
  },

  _destroyBinds: function () {
    this.stopListening(this.collection);
    Backbone.Form.editors.Base.prototype._destroyBinds.call(this);
  },

  _onItemSelected: function (model) {
    this._listView.hide();
    this._popupManager.untrack();
    this._renderButton(model);
    this.trigger('change', this);
  },

  _onButtonClick: function () {
    if (this._isDisabled) {
      return;
    }

    this._listView.toggle();
    this._listView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
    this._onToggleSelected();
  },

  _onButtonKeyDown: function (event) {
    if (this._isDisabled) {
      return;
    }

    if (event.which === ENTER_KEY_CODE) {
      event.preventDefault();

      if (!this._listView.isVisible()) {
        event.stopPropagation();
        this._listView.toggle();
      } else {
        this._popupManager.track();
      }
    }
  },

  getValue: function () {
    var item = this.collection.getSelectedItem();
    if (item) {
      return item.getValue();
    } else {
      return this.value;
    }
  },

  setValue: function (value) {
    var selectedModel = this.collection.setSelected(value);
    if (selectedModel) {
      this._renderButton(selectedModel);
    } else {
      this.render();
    }
    this.value = value;
  },

  _renderSelected: function () {
    var selectedModel = this.collection.getSelectedItem();
    if (selectedModel) {
      this._renderButton(selectedModel);
    }
  },

  _getButton: function () {
    return this.$('.js-button');
  },

  _getButtonTemplateData: function (model) {
    return _.extend({ isSourceType: false }, model.attributes, { label: model.getName() });
  },

  _renderButton: function (model) {
    var button = this._getButton();
    var data = this._getButtonTemplateData(model);
    var $html = this.options.selectedItemTemplate(data);

    button
      .removeClass('is-empty')
      .html($html);

    this._initButtonBinds();

    if (this._help) {
      this._removeTooltip();

      this._helpTooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 'w',
        title: function () {
          return $(this).data('tooltip');
        }
      });
    }

    return button;
  },

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  _initButtonBinds: function () {
    var button = this._getButton();

    button
      .on('mouseover', this._onMouseOver.bind(this))
      .on('mouseout', this._onMouseOut.bind(this));
  },

  _destroyButtonBinds: function () {
    var button = this._getButton();

    button
      .off('mouseover', this._onMouseOver.bind(this))
      .off('mouseout', this._onMouseOut.bind(this));
  },

  remove: function () {
    this._removeTooltip();
    this._popupManager && this._popupManager.destroy();
    this._listView && this._listView.clean();
    this._destroyButtonBinds();
    this._destroyBinds();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  },

  _onToggleSelected: function () {
    var visible = this._listView.isVisible();

    this.$el.toggleClass('is-active', visible);

    if (!visible) {
      this._getButton().blur();
    }
  },

  _onMouseOver: function () {
    this._mouseOverAction && this._mouseOverAction();
  },

  _onMouseOut: function () {
    this._mouseOutAction && this._mouseOutAction();
  },

  clean: function () {
    this.$el.remove();
  }
});
