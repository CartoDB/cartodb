var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var StackLayoutView = require('../../../../components/stack-layout/stack-layout-view');
var MeasurementsView = require('./measurements-list-view');
var FiltersView = require('./filters-list-view');

var REQUIRED_OPTS = [
  'measurementsCollection',
  'filtersCollection'
];

module.exports = CoreView.extend({
  className: 'CDB-Box-modal CustomList',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    // For internal state
    this.model = new Backbone.Model({
      visible: false
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._generateStackLayoutView();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:visible', function (mdl, isVisible) {
      isVisible ? this.render() : this.clearSubViews();
      this._toggleVisibility();
    });
  },

  _generateStackLayoutView: function () {
    var createListView = function (stackLayoutModel, opts) {
      return this._createListView(stackLayoutModel, opts);
    }.bind(this);

    var createFilterView = function (stackLayoutModel, opts) {
      return this._createFilterView(stackLayoutModel, opts);
    }.bind(this);

    var stackViewCollection = new Backbone.Collection([{
      createStackView: createListView
    }, {
      createStackView: createFilterView
    }]);

    this._stackLayoutView = new StackLayoutView({ collection: stackViewCollection });
    this.addView(this._stackLayoutView);
    this.$el.append(this._stackLayoutView.render().$el);
  },

  _createListView: function (stackLayoutModel, opts) {
    var view = new MeasurementsView({
      measurementsCollection: this._measurementsCollection,
      filtersCollection: this._filtersCollection
    });

    view.bind('filters', function () {
      stackLayoutModel.nextStep();
    }, this);

    return view;
  },

  _createFilterView: function (stackLayoutModel, opts) {
    var view = new FiltersView({
      filtersCollection: this._filtersCollection
    });

    view.bind('back', function () {
      this._measurementsCollection.trigger('maybeFiltersUpdated');
      stackLayoutModel.prevStep();
    }, this);

    return view;
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
  }
});
