var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var DatasetsView = require('./datasets/datasets-view');
var ImportsView = require('./imports/imports-view');
var TabPaneView = require('../../../tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../tab-pane/tab-pane-collection');

/**
 *  Create listing view
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */
module.exports = cdb.core.View.extend({
  className: 'CreateDialog-listing CreateDialog-listing--noPaddingTop',

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._createModel = opts.createModel;
    this._configModel = opts.configModel;

    this._initBinds();
    this._onChangeListing();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    // Bug with binding... do not work with the usual one for some reason :(
    this._createModel.bind('change:listing', this._onChangeListing.bind(this));
    this.add_related_model(this._createModel);
  },

  _initViews: function () {
    var self = this;

    var paneModels = [{
      name: 'datasets',
      selected: false,
      createContentView: function () {
        return new DatasetsView({
          userModel: self._userModel,
          createModel: self._createModel
        });
      }
    }];

    if (this._userModel.canCreateDatasets()) {
      paneModels.push({
        name: 'import',
        selected: false,
        createContentView: function () {
          return new ImportsView({
            userModel: self._userModel,
            configModel: self._configModel,
            createModel: self._createModel
          });
        }
      });
    }

    this._tabPaneCollection = new TabPaneCollection(paneModels);
    var paneTabPaneView = new TabPaneView({
      collection: this._tabPaneCollection
    });
    this.addView(paneTabPaneView);
    this.$el.append(paneTabPaneView.render().el);
  },

  _onChangeListing: function () {
    if (this._tabPaneCollection) {
      var context = this._createModel.get('listing');
      var paneModel = _.first(this._tabPaneCollection.where({ name: context }));
      paneModel.set('selected', true);
    }
  }
});
