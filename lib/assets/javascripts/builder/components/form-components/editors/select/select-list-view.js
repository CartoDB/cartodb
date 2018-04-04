var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomView = require('builder/components/custom-list/custom-view');
var DropdownOverlayView = require('builder/components/dropdown-overlay/dropdown-overlay-view');
var statusTemplate = require('./select-list-view-states.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'collection',
  'itemTemplate',
  'itemView'
];

module.exports = CoreView.extend({
  module: 'components:form-components:editors:select:select-list-view',

  className: 'CustomList',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._selectModel = this.options.selectModel;
    this.model = new Backbone.Model({
      visible: false
    });

    if (this.options.mouseOverAction) {
      this._mouseOverAction = this.options.mouseOverAction;
    }

    if (this.options.mouseOutAction) {
      this._mouseOutAction = this.options.mouseOutAction;
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderListSection();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:visible', function (mdl, isVisible) {
      isVisible ? this.render() : this.clearSubViews();
      this._toggleVisibility();
      this.trigger('change:visible');
    });

    if (this.collection.isAsync()) {
      this.listenTo(this.collection.stateModel, 'change:state', this._renderListSection);
    }
  },

  _createListView: function () {
    if (this._listView) {
      this._listView.clean();
      this.removeView(this._listView);
    }
    this._listView = new CustomView({
      className: 'CDB-Box-modal CustomList--inner',
      collection: this.collection,
      showSearch: this.options.showSearch,
      allowFreeTextInput: this.options.allowFreeTextInput,
      typeLabel: this.options.typeLabel,
      itemTemplate: this._itemTemplate,
      itemView: this._itemView,
      position: this.options.position,
      searchPlaceholder: this.options.searchPlaceholder,
      selectModel: this._selectModel,
      mouseOverAction: this._mouseOverAction,
      mouseOutAction: this._mouseOutAction
    });

    this.addView(this._listView);
    this._listView.show();
    this.el.appendChild(this._listView.render().el);
  },

  _createStatusView: function (status) {
    var el = statusTemplate({
      status: status,
      type: this.options.typeLabel
    });

    this.$el.html(el);
  },

  _renderListSection: function () {
    var status = this._getStatus();

    if (status === 'fetched') {
      this._createListView();
    } else {
      this._createStatusView(status);
    }
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  _renderOverlay: function () {
    var closestModalDialog = this.$el.closest('.Dialog');

    this._dropdownOverlay = new DropdownOverlayView({
      container: closestModalDialog.length ? closestModalDialog : undefined,
      onClickAction: this.hide.bind(this),
      visible: true
    });

    this.addView(this._dropdownOverlay);
  },

  _destroyOverlay: function () {
    this._dropdownOverlay && this._dropdownOverlay.clean() && this.removeView(this._dropdownOverlay);
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.isVisible());

    if (this.isVisible()) {
      this._renderOverlay();
    } else {
      this._destroyOverlay();
    }
  },

  _getStatus: function () {
    if (this.collection.isAsync()) {
      return this.collection.stateModel.get('state');
    } else {
      return 'fetched';
    }
  },

  _destroyBinds: function () {
    this.stopListening(this.collection);
  },

  _onMouseOver: function () {
    this._mouseOverAction && this._mouseOverAction();
  },

  _onMouseOut: function () {
    this._mouseOutAction && this._mouseOutAction();
  },

  remove: function () {
    this._listView && this._listView.clean();
    this._dropdownOverlay && this._dropdownOverlay.clean();
    this._destroyBinds();
  }
});
