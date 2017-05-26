var Backbone = require('backbone');
var _ = require('underscore');
var EditorHelpers = require('../editor-helpers-extend');
var template = require('./data-observatory-measurements.tpl');
var selectedItemTemplate = require('./data-observatory-measurement-item.tpl');
var DropdownDialogView = require('./measurements-dialog-view');
var PopupManager = require('../../../popup-manager');
var MeasurementsCollection = require('../../../../data/data-observatory/measurements-collection');

var ENTER_KEY_CODE = 13;
var STATE = {
  idle: 'idle',
  loading: 'loading',
  fetching: 'fetching',
  fetched: 'fetched',
  error: 'error'
};

var wrap = function (value) {
  return "'{" + value + "}'";
};

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

    // update form attributes silently
    this._silentChangeInitially = this.options.silentChangeInitially;

    var collectionOptions = {
      configModel: this.options.configModel,
      nodeDefModel: this.options.nodeDefModel
    };

    this.measurementsCollection = (!this.options.measurements) ? new MeasurementsCollection([], collectionOptions) : this.options.measurements;

    this._modelView = new Backbone.Model({
      state: STATE.idle
    });

    this._initBinds();

    this._dialogView = new DropdownDialogView({
      measurementsCollection: this.measurementsCollection
    });

    this._fetch();
  },

  render: function () {
    var isLoading = this._isLoading();
    var isEmpty = !this._hasItems();
    var isDisabled = !isEmpty ? this.options.disabled : true;
    var name = this.model.get(this.options.keyAttr);
    // What happens if the selected value it's not there when area changes and the collection is fetched again
    var item = this.measurementsCollection.getItem(name);
    var isNull = name === null;
    var label = isNull ? 'null' : (item ? item.getName() : false);
    var placeholder = this.options.placeholder;

    this.$el.html(
      this.template({
        label: label,
        keyAttr: this.options.keyAttr,
        placeholder: placeholder,
        isDisabled: isDisabled,
        isLoading: isLoading,
        isEmpty: isEmpty,
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
      this._popupManager.untrack();
    }.bind(this);

    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);

    this.listenTo(this.measurementsCollection, 'change:selected', this._onItemSelected);
    this.listenTo(this._modelView, 'change:state', this.render);
    this.listenTo(this.model, 'change:area', this._fetch);
  },

  _fetch: function () {
    var area = this.options.region;
    var fetchOptions = {
      success: this._onFetchSuccess.bind(this),
      error: this._onFetchError.bind(this),
      region: area && wrap(area)
    };

    this.measurementsCollection.fetch(fetchOptions);
    this._modelView.set({ state: STATE.loading });
  },

  _syncSelected: function () {
    var name = this.model.get(this.options.keyAttr);
    var item;

    if (name) {
      item = this.measurementsCollection.getItem(name);
      if (item && !item.get('selected')) {
        this.measurementsCollection.setSelected(name);
      }
    }
  },

  _onFetchSuccess: function () {
    this._modelView.set({ state: STATE.fetched });
    // If region changes, a fetch happens with new data
    // we try to check the selected in order to set the value in the form
    this._syncSelected();
  },

  _onFetchError: function () {
    this._modelView.set({ state: STATE.error });
  },

  _hasItems: function () {
    var state = this.measurementsCollection.getState();
    return state === STATE.fetched && this.measurementsCollection.length > 0;
  },

  _isLoading: function () {
    var state = this.measurementsCollection.getState();
    return state === STATE.fetching;
  },

  _onItemSelected: function (mdl) {
    this._dialogView.hide();
    this._popupManager.untrack();
    this._renderLicense(mdl);
    this._renderButton(mdl).focus();

    if (!this._silentChangeInitially) {
      this.trigger('change', this);
    } else {
      this._silentChangeInitially = false;
    }
  },

  _onButtonClick: function () {
    if (this._hasItems()) {
      this._dialogView.toggle();
      this._dialogView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
    }
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
    var item = this.measurementsCollection.getSelectedItem();
    if (item) {
      return item.getValue();
    }
    return;
  },

  setValue: function (value) {
    var selectedModel = this.measurementsCollection.setSelected(value);
    if (selectedModel) {
      this._renderButton(selectedModel);
    }
    this.value = value;
  },

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var $html = this.options.selectedItemTemplate({
      label: mdl.getName()
    });

    button
      .removeClass('is-empty')
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
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
