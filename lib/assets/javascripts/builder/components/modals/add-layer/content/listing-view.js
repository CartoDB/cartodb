var CoreView = require('backbone/core-view');
var _ = require('underscore');
var DatasetsView = require('./datasets/datasets-view');
var ImportsView = require('./imports/imports-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'createModel',
  'userModel',
  'configModel',
  'privacyModel',
  'guessingModel'
];

/**
 *  Create listing view
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */
module.exports = CoreView.extend({
  className: 'CreateDialog-listing CreateDialog-listing--noPaddingTop',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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
    this.listenTo(this._createModel, 'change:listing', this._onChangeListing);
  },

  _initViews: function () {
    var self = this;
    var paneModels = [];

    paneModels.push({
      name: 'datasets',
      selected: false,
      createContentView: function () {
        return new DatasetsView({
          userModel: self._userModel,
          createModel: self._createModel
        });
      }
    });

    if (this._userModel.canCreateDatasets()) {
      paneModels.push({
        name: 'import',
        selected: false,
        createContentView: function () {
          return new ImportsView({
            userModel: self._userModel,
            configModel: self._configModel,
            createModel: self._createModel,
            privacyModel: self._privacyModel,
            guessingModel: self._guessingModel
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
