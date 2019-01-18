var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var BaseDialog = require('../../views/base_dialog/view.js');
var randomQuote = require('../../view_helpers/random_quote.js');
var ViewFactory = require('../../view_factory.js');
var ViewModel = require('./add_custom_basemap_model.js');
var TabsView = require('./tabs_view.js');

/**
 * Dialog to add ¯custom basemap to current map.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    this.model = new ViewModel({
      map: this.options.map,
      baseLayers: this.options.baseLayers
    });
    this._initViews();
    this._initBinds();
  },

  /**
   * @override cdb.ui.common.Dialog.prototype.render
   */
  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this.$('.content').addClass('Dialog-contentWrapper');
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    var contentView = this._panes.active(this.model.get('currentView')).render();
    contentView.$el.addClass('Dialog-body Dialog-body--expanded Dialog-body--create');
    contentView.delegateEvents(); // enable events after being added to $el
    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/add_custom_basemap')({
        model: this.model
      })
    );
    $el.append(contentView.el);
    return $el;
  },

  ok: function() {
    if (this.model.canSaveBasemap()) {
      this.model.saveBasemap();
    }
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('tabs',
      new TabsView({
        model: this.model
      })
    );
    this._panes.addTab('saving',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Setting basemap…',
        quote: randomQuote()
      }).render()
    );
    this._panes.addTab('saveFail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );
    this._panes.active(this.model.get('currentView'));
  },

  _initBinds: function() {
    this.model.bind('change:currentView', this._onCurrentViewChange, this);
  },

  _onCurrentViewChange: function() {
    if (this.model.get('currentView') === 'saveDone') {
      this.close();
    } else {
      this.render();
    }
  }

});
