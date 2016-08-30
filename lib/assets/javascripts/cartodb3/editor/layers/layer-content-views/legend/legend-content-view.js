var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var sqlErrorTemplate = require('./legend-content-sql-error.tpl');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var QuerySanity = require('../../query-sanity-check');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var LegendTypes = require('./legend-types.js');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

var REQUIRED_OPTS = [
  'querySchemaModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.querySchemaModel = this._querySchemaModel;

    // TOFIX
    this.model = new Backbone.Model({
      type: 'none'
    });

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });

    this._carouselCollection = new CarouselCollection(
      _.map(LegendTypes, function (legend) {
        return {
          selected: this.model.get('type') === legend.value,
          val: legend.value,
          label: legend.label,
          template: function () {
            return (legend.legendIcon && legend.legendIcon()) || legend.value;
          }
        };
      }, this)
    );

    this._initBinds();

    // In order to handle sql errors
    QuerySanity.track(this, this.render.bind(this));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    // TBD
  },

  _initViews: function () {
    if (this._hasError()) {
      this._showError();
    } else {
      // TODO: Form view
      this._renderCarousel();
    }
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('./legend-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _getInitialState: function () {
    return STATES.ready;
  },

  _hasError: function () {
    return this.modelView.get('state') === STATES.error;
  },

  _isLoading: function () {
    return this.modelView.get('state') === STATES.loading;
  },

  _isReady: function () {
    return this.modelView.get('state') === STATES.ready;
  },

  _showError: function () {
    this.$el.empty();
    this.$el.append(
      sqlErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  }
});
