var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../custom-list/custom-view');
var statusTemplate = require('./select-list-view-states.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'collection',
  'itemTemplate',
  'itemView'
];

module.exports = CoreView.extend({
  className: 'CustomList',
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      visible: false
    });

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
    });

    if (this._collection.isAsync()) {
      this.listenTo(this._collection.stateModel, 'change:state', this._renderListSection);
    }
  },

  _createListView: function () {
    if (this._listView) {
      this._listView.clean();
      this.removeView(this._listView);
    }

    this._listView = new CustomListView({
      className: 'CDB-Box-modal CustomList--inner',
      collection: this._collection,
      showSearch: this.options.showSearch,
      allowFreeTextInput: this.options.allowFreeTextInput,
      typeLabel: this.options.typeLabel,
      itemTemplate: this._itemTemplate,
      itemView: this._itemView,
      position: this.options.position,
      searchPlaceholder: this.options.searchPlaceholder
    });

    this.addView(this._listView);
    this._listView.show();
    this.el.append(this._listView.el);
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

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.isVisible());
  },

  _getStatus: function () {
    if (this._collection.isAsync()) {
      return this._collection.stateModel.get('state');
    } else {
      return 'fetched';
    }
  },

  _destroyBinds: function () {
    this.stopListening(this._collection);
  },

  remove: function () {
    this._listView && this._listView.clean();
    this._destroyBinds();
  }
});
