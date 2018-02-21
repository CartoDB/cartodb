var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var MeasurementsView = require('./measurements-list-view');
var FiltersView = require('./filters-list-view');

var REQUIRED_OPTS = [
  'filtersCollection',
  'measurementsCollection',
  'measurementModel',
  'region'
];

var braces = function (value) {
  var template = _.template("'{<%- value %>}'");
  return template({
    value: value
  });
};

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

  _buildFilters: function () {
    var selectedFilters = this._filtersCollection.getSelected();
    return _.map(selectedFilters, function (filter) {
      return filter.getValue();
    }).join(', ');
  },

  _fetchMeasurements: function () {
    var region = this._region;
    var fetchOptions = {
      region: region && braces(region)
    };

    return this._measurementsCollection.fetch(fetchOptions);
  },

  _fetchMeasurementsWithFilter: function () {
    var region = this._region;
    var filters = this._buildFilters();

    var fetchOptions = {
      filters: filters && braces(filters),
      region: region && braces(region)
    };

    return this._measurementsCollection.fetch(fetchOptions);
  },

  _searchMeasurements: function (keyword) {
    var region = this._region;
    var filters = this._buildFilters();

    var fetchOptions = {
      filters: filters && braces(filters),
      region: region && braces(region),
      search: keyword,
      abortable: true
    };

    return this._measurementsCollection.fetch(fetchOptions);
  },

  _fetchFilters: function () {
    var region = this._region;
    var fetchOptions = {
      region: region && braces(region)
    };

    return this._filtersCollection.fetch(fetchOptions);
  },

  _fetchCollections: function () {
    var selectedFilters = this._filtersCollection.getSelected();

    if (selectedFilters.length > 0) {
      this._fetchMeasurementsWithFilter();
    } else {
      this._fetchMeasurements();
    }
  },

  _createListView: function (stackLayoutModel, opts) {
    this._fetchCollections();

    var view = new MeasurementsView({
      filtersCollection: this._filtersCollection,
      measurementsCollection: this._measurementsCollection,
      searchMeasurements: this._searchMeasurements.bind(this),
      measurementModel: this._measurementModel
    });

    view.bind('filters', function () {
      stackLayoutModel.nextStep();
    }, this);

    return view;
  },

  _createFilterView: function (stackLayoutModel, opts) {
    // FIXME
    // we could save this request, it only depends on region
    if (this._filtersCollection.size() === 0) {
      this._fetchFilters();
    }

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
