var CoreView = require('backbone/core-view');
var template = require('./add-basemap.tpl');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var ViewFactory = require('builder/components/view-factory');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var _ = require('underscore');
var TabsView = require('./tabs-view');

/**
 * Add basemap dialog
 */
module.exports = CoreView.extend({

  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-ok': 'ok'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('modalModel is required');
    if (!opts.createModel) throw new TypeError('createModel is required');

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

    this._submitButtom = this.$('.js-ok');
    this._modalFooter = this.$('.js-Modal-footer');

    this._tabPaneCollection = new TabPaneCollection([
      {
        name: 'tabs',
        selected: this._createModel.get('contentPane') === 'tabs',
        createContentView: function () {
          return new TabsView({
            model: self._createModel,
            submitButton: self._submitButtom,
            modalFooter: self._modalFooter
          });
        }
      }, {
        name: 'addingBasemap',
        selected: this._createModel.get('contentPane') === 'addingBasemap',
        createContentView: function () {
          self._disableModalFooter(true);

          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-basemap.adding-basemap')
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

  _disableModalFooter: function (disable) {
    this._modalFooter.toggleClass('is-disabled', disable);
  },

  ok: function () {
    if (this._createModel.canSaveBasemap()) {
      this._createModel.saveBasemap();
    }
  }

});
