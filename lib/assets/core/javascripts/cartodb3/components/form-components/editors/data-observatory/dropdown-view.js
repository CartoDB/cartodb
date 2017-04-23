var Backbone = require('backbone');
var _ = require('underscore');
var template = require('./dropdown.tpl');
var selectedItemTemplate = require('./dropdown-item.tpl');
var DropdownDialogView = require('./dropdown-dialog-view');
var PopupManager = require('../../../popup-manager');
var MeasurementsCollection = require('../../../../data/data-observatory/measurements-collection');
var FiltersCollection = require('../../../../data/data-observatory/filters-collection');

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
    this._setOptions(opts);

    this.template = opts.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';

    var collectionOptions = {
      configModel: this.options.configModel,
      layerDefinitionModel: this.options.layerDefinitionModel
    };

    this.measurementsCollection = new MeasurementsCollection([], collectionOptions);
    this.filtersCollection = new FiltersCollection([], collectionOptions);

    this._modelView = new Backbone.Model({
      state: STATE.idle
    });

    this._initBinds();

    this._dialogView = new DropdownDialogView({
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection
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
    this.listenTo(this.model, 'change:area', _.debounce(this._fetch, 50));
  },

  _fetch: function () {
    var area = this.options.region;
    var fetchOptions = {
      success: this._onFetchSuccess.bind(this),
      error: this._onFetchError.bind(this),
      region: area && wrap(area)
    };

    this.measurementsCollection.fetch(fetchOptions);
    this.filtersCollection.fetch(fetchOptions);
    this._modelView.set({state: STATE.loading});
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
    var measurementsReady = this.measurementsCollection.getState() === STATE.fetched;
    var filtersReady = this.filtersCollection.getState() === STATE.fetched;

    if (filtersReady && measurementsReady) {
      this._modelView.set({state: STATE.fetched});
      // If region changes, a fetch happens with new data
      // we try to check the selected in order to set the value in the form
      this._syncSelected();
    }
  },

  _onFetchError: function () {
    this._modelView.set({state: STATE.error});
  },

  _hasItems: function () {
    var state = this.measurementsCollection.getState();
    return state === STATE.fetched && this.measurementsCollection.filter(function (mdl) {
      var filter = mdl.get('filter');
      return filter.length > 0;
    }).length > 0;
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
    this.trigger('change', this);
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
