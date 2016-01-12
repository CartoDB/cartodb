var _ = require('underscore');
var DataviewModelBase = require('./dataview-model-base');
var SearchModel = require('./category-dataview/search-model');
var CategoryModelRange = require('./category-dataview/category-model-range');
var CategoriesCollection = require('./category-dataview/categories-collection');

/**
 * Category dataview model
 *
 * - It has several internal models/collections
 *   - search model: it manages category search results.
 *   - filter model: it knows which items are accepted or rejected.
 */
module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      ownFilter: false,
      allCategoryNames: [] // all (new + previously accepted), updated on data fetch (see parse)
    },
    DataviewModelBase.prototype.defaults
  ),

  url: function () {
    return this.get('url') + '?bbox=' + this.get('boundingBox') + '&own_filter=' + (this.get('ownFilter') ? 1 : 0);
  },

  initialize: function (attrs, opts) {
    DataviewModelBase.prototype.initialize.call(this, attrs, opts);

    // Internal model for calculating total amount of values in the category
    this._rangeModel = new CategoryModelRange();

    this._data = new CategoriesCollection();
    this._searchModel = new SearchModel();
  },

  // Set any needed parameter when they have changed in this model
  _setInternalModels: function () {
    var url = this.get('url');

    this._searchModel.set({
      url: url,
      boundingBox: this.get('boundingBox')
    });

    this._rangeModel.setUrl(url);
  },

  _onChangeBinds: function () {
    this._setInternalModels();

    this._rangeModel.bind('change:totalCount change:categoriesCount', function () {
      this.set({
        totalCount: this._rangeModel.get('totalCount'),
        categoriesCount: this._rangeModel.get('categoriesCount')
      });
    }, this);

    this.bind('change:url', function () {
      if (this.get('sync') && !this.isDisabled()) {
        this._fetch();
      }
    }, this);

    this.bind('change:boundingBox', function () {
      // If a search is applied and bounding bounds has changed,
      // don't fetch new raw data
      if (this.get('bbox') && !this.isSearchApplied() && !this.isDisabled()) {
        this._fetch();
      }
    }, this);

    this.bind('change:url change:boundingBox', function () {
      this._searchModel.set({
        url: this.get('url'),
        boundingBox: this.get('boundingBox')
      });
    }, this);

    this.bind('change:disabled', function (mdl, isDisabled) {
      if (!isDisabled) {
        if (mdl.changedAttributes(this._previousAttrs)) {
          this._fetch();
        }
      } else {
        this._previousAttrs = {
          url: this.get('url'),
          boundingBox: this.get('boundingBox')
        };
      }
    }, this);

    this._searchModel.bind('loading', function () {
      this.trigger('loading', this);
    }, this);
    this._searchModel.bind('sync', function () {
      this.trigger('sync', this);
    }, this);
    this._searchModel.bind('error', function (e) {
      if (!e || (e && e.statusText !== 'abort')) {
        this.trigger('error', this);
      }
    }, this);
    this._searchModel.bind('change:data', function () {
      this.trigger('change:searchData', this);
    }, this);
  },

  // Search model helper methods //

  getSearchQuery: function () {
    return this._searchModel.getSearchQuery();
  },

  setSearchQuery: function (q) {
    this._searchModel.set('q', q);
  },

  isSearchValid: function () {
    return this._searchModel.isValid();
  },

  getSearchResult: function () {
    return this._searchModel.getData();
  },

  getSearchCount: function () {
    return this._searchModel.getCount();
  },

  applySearch: function () {
    this._searchModel.fetch();
  },

  isSearchApplied: function () {
    return this._searchModel.isSearchApplied();
  },

  cleanSearch: function () {
    this._searchModel.resetData();
  },

  setupSearch: function () {
    if (!this.isSearchApplied()) {
      this._searchModel.setData(
        this._data.toJSON()
      );
    }
  },

  getData: function () {
    return this._data;
  },

  getSize: function () {
    return this._data.size();
  },

  getCount: function () {
    return this.get('categoriesCount');
  },

  isOtherAvailable: function () {
    return this._data.isOtherAvailable();
  },

  refresh: function () {
    if (this.isSearchApplied()) {
      this._searchModel.fetch();
    } else {
      this._fetch();
    }
  },

  parse: function (d) {
    var newData = [];
    var _tmpArray = {};
    var allNewCategories = d.categories;
    var allNewCategoryNames = [];
    var acceptedCategoryNames = [];

    _.each(allNewCategories, function (datum) {
      // Category might be a non-string type (e.g. number), make sure it's always a string for concistency
      var category = datum.category.toString();

      allNewCategoryNames.push(category);
      var isRejected = this.filter.isRejected(category);
      _tmpArray[category] = true;

      newData.push({
        selected: !isRejected,
        name: category,
        agg: datum.agg,
        value: datum.value
      });
    }, this);

    if (this.get('ownFilter')) {
      // Add accepted items that are not present in the categories data
      this.filter.acceptedCategories.each(function (mdl) {
        var category = mdl.get('name');
        acceptedCategoryNames.push(category);
        if (!_tmpArray[category]) {
          newData.push({
            selected: true,
            name: category,
            agg: false,
            value: 0
          });
        }
      }, this);
    }

    this._data.reset(newData);
    return {
      allCategoryNames: _
        .chain(allNewCategoryNames)
        .union(acceptedCategoryNames)
        .unique()
        .value(),
      data: newData,
      nulls: d.nulls,
      min: d.min,
      max: d.max,
      count: d.count
    };
  },

  // Backbone toJson function override
  toJSON: function () {
    return {
      type: 'aggregation',
      options: {
        column: this.get('column'),
        aggregation: this.get('aggregation'),
        aggregationColumn: this.get('aggregationColumn')
      }
    };
  }

});
