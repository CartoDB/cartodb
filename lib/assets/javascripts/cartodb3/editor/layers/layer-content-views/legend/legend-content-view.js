var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var sqlErrorTemplate = require('./legend-content-sql-error.tpl');
// var QuerySanity = require('../query-sanity-check');

var ACTION_ERROR_TEMPLATE = _.template("<button class='CDB-Text u-actionTextColor js-fix-sql'><%- label %></button>");

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

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });

    this._initBinds();

    // In order to handle sql errors
    // QuerySanity.track(this, this.render.bind(this));
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
      this.$el.html('Legend form');
    }
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
          action: ACTION_ERROR_TEMPLATE({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  }
});
