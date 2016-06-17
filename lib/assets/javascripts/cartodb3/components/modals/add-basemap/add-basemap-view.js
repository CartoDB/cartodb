var CoreView = require('backbone/core-view');
var template = require('./add-basemap.tpl');
var TabPaneView = require('../../tab-pane/tab-pane-view');
var TabPaneCollection = require('../../tab-pane/tab-pane-collection');
var ViewFactory = require('../../view-factory');
var renderLoading = require('../../loading/render-loading');
var ErrorView = require('../../error/error-view');
var _ = require('underscore');
var TabsView = require('./tabs-view.js');

/**
 * Add basemap dialog
 */
module.exports = CoreView.extend({

  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-ok': 'ok'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');
    if (!opts.modalModel) throw new TypeError('model is required');
    if (!opts.createModel) throw new TypeError('createModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userLayersCollection = opts.userLayersCollection;
    this._modalModel = opts.modalModel;
    this._createModel = opts.createModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initBinds: function () {
    this._createModel.bind('saveBasemapDone', this._modalModel.destroy.bind(this._modalModel), this);
    this._createModel.bind('change:contentPane', this._onChangeContentView, this);
    this.add_related_model(this._createModel);
  },

  _onChangeContentView: function () {
    var context = this._createModel.get('contentPane');
    var paneModel = _.first(this._tabPaneCollection.where({ name: context }));
    paneModel.set('selected', true);
  },

  _initViews: function () {
    var self = this;

    this._tabPaneCollection = new TabPaneCollection([
      {
        name: 'tabs',
        selected: this._createModel.get('contentPane') === 'tabs',
        createContentView: function () {
          return new TabsView({
            model: self._createModel
          });
        }
      }, {
        name: 'addingNewBasemap',
        selected: this._createModel.get('contentPane') === 'addingNewBasemap',
        createContentView: function () {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-basemap.adding-new-basemap')
            })
          );
        }
      }, {
        name: 'addBasemapFailed',
        selected: this._createModel.get('contentPane') === 'addBasemapFailed',
        createContentView: function () {
          return new ErrorView({
            title: _t('components.modals.add-basemap.add-basemap-error')
          });
        }
      }
    ]);

    var tabPaneView = new TabPaneView({
      collection: this._tabPaneCollection
    });
    this.addView(tabPaneView);
    this.$('.js-content-container').append(tabPaneView.render().el);
  },

  ok: function () {
    if (this._createModel.canSaveBasemap()) {
      this._createModel.saveBasemap();
    }
  }

});
