var Backbone = require('backbone');
var _ = require('underscore');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var template = require('./data-observatory-measurements.tpl');
var selectedItemTemplate = require('./data-observatory-measurement-item.tpl');
var DropdownDialogView = require('./data-observatory-dropdown-measurements-view');
var PopupManager = require('builder/components/popup-manager');
var MeasurementsCollection = require('builder/data/data-observatory/measurements-collection');
var FiltersCollection = require('builder/data/data-observatory/filters-collection');

var ENTER_KEY_CODE = 13;
var STATE = {
  idle: 'idle',
  loading: 'loading',
  fetching: 'fetching',
  fetched: 'fetched',
  error: 'error'
};
var MEASUREMENT_ATTRIBUTES = ['aggregate', 'type', 'label', 'val', 'description', 'filter', 'license'];

Backbone.Form.editors.DataObservatoryDropdown = Backbone.Form.editors.Base.extend({

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

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.template = opts.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';

    this.measurementModel = this.options.measurementModel;

    var fetchOptions = {
      configModel: this.options.configModel,
      nodeDefModel: this.options.nodeDefModel
    };

    this.measurementsCollection = new MeasurementsCollection([], fetchOptions);
    this.filtersCollection = new FiltersCollection([], fetchOptions);

    this._initBinds();

    this._dialogView = new DropdownDialogView({
      configModel: this.options.configModel,
      nodeDefModel: this.options.nodeDefModel,
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection,
      measurementModel: this.measurementModel,
      region: this.options.region
    });
  },

  render: function () {
    var isLoading = this._isLoading();
    var isDisabled = this.options.disabled;
    var item = this.measurementModel;
    var placeholder = this._getPlaceholder();
    var isNull = this._hasValue();
    var label = isNull ? placeholder : item.getName();
    var title = item.getName() || '';

    this.$el.html(
      this.template({
        title: title,
        label: label,
        keyAttr: this.options.keyAttr,
        isDisabled: isDisabled,
        isLoading: isLoading,
        isNull: isNull
      })
    );

    this._popupManager = new PopupManager(this.cid, this.$el, this._dialogView.$el);
    this._popupManager.append(this.dialogMode);

    if (item) {
      this._renderLicense(item);
    }

    return this;
  },

  _initBinds: function () {
    var hide = function () {
      this._dialogView.hide();
      this._popupManager && this._popupManager.untrack();
    }.bind(this);

    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);

    this.listenTo(this.measurementsCollection, 'change:selected', this._onItemSelected);
  },

  _destroyBinds: function () {
    this.stopListening(this.measurementsCollection);
    Backbone.Form.editors.Base.prototype._destroyBinds.call(this);
  },

  _getPlaceholder: function (isDisabled) {
    var keyAttr = this.options.keyAttr;
    var placeholder = this.options.placeholder || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr });
    return placeholder;
  },

  _hasValue: function () {
    var name = this.measurementModel.getValue();
    return name == null || name === '';
  },

  _isLoading: function () {
    var state = this.measurementModel.getState();
    return state === STATE.fetching;
  },

  _onItemSelected: function (mdl) {
    var selected = this.measurementsCollection.getSelectedItem();

    if (selected) {
      this.measurementModel.clear({silent: true});
      this.measurementModel.set(_.pick(selected.attributes, MEASUREMENT_ATTRIBUTES));
    }

    this._dialogView.hide();
    this._popupManager.untrack();
    this._renderLicense(selected);
    this._renderButton(selected).focus();

    this.trigger('change', this);
  },

  _onButtonClick: function () {
    this._dialogView.toggle();
    this._dialogView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._dialogView.isVisible()) {
        ev.stopPropagation();
        this._onButtonClick();
      } else {
        this._popupManager.track();
      }
    }
  },

  validate: function () {
    var value = this.getValue();
    var validators = this.schema.validators;
    var getValidator = this.getValidator;

    if (!validators) return null;

    // Run through validators until an error is found
    var error = null;
    _.every(validators, function (validator) {
      error = getValidator(validator)(value, {});

      return !!error;
    });

    // Return error to be aggregated by list
    return error ? error : null; // eslint-disable-line
  },

  focus: function () {
    this.$('.js-button').focus();
  },

  blur: function () {
    this.$('.js-button').blur();
  },

  getValue: function () {
    var item = this.measurementModel;
    if (item) {
      return item.getValue();
    } else if (this.value) {
      return this.value;
    }
  },

  setValue: function (value) {
    var selectedModel = this.measurementModel;
    if (selectedModel) {
      this._renderButton(selectedModel);
    }
    this.value = value;
  },

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var label = mdl.getName();
    var $html = this.options.selectedItemTemplate({
      label: label
    });

    button
      .removeClass('is-empty')
      .attr('title', label)
      .html($html);

    return button;
  },

  _renderLicense: function (mdl) {
    var license = mdl.get('license');
    var $license = this.$('.js-license');
    $license
      .removeClass('u-isHidden')
      .find('span')
      .text(license);
  },

  remove: function () {
    this._popupManager && this._popupManager.destroy();
    this._dialogView && this._dialogView.clean();
    this._destroyBinds();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
