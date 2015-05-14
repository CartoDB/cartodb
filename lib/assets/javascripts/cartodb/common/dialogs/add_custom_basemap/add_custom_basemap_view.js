var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var BaseDialog = require('../../views/base_dialog/view.js');
var randomQuote = require('../../view_helpers/random_quote.js');
var ViewFactory = require('../../view_factory.js');
var ViewModel = require('./add_custom_basemap_model.js');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-open-old-dialog': '_openOldDialog'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.model = new ViewModel({
    });
    this._initViews();
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this.$('.content').addClass('Dialog-content--expanded');
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/add_custom_basemap')({
        model: this.model
      })
    );
    var tabContentView = this._panes.getActivePane();
    $el.find('.js-tab-content').append(tabContentView.render().el);
    tabContentView.delegateEvents(); // enable events after being added to $el
    return $el;
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);

    this.model.get('tabs').each(function(m) {
      this._panes.addTab(m.get('name'), m.createView());
    }, this);

    this._panes.addTab('saving',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Saving…',
        quote: randomQuote()
      }).render()
    );
    this._panes.addTab('saveFail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );
    this._panes.active(this.model.get('currentTab'));
  },

  _initBinds: function() {
    this.model.bind('change:currentTab', this.render, this);
  },

  // TODO: Remove once all tabs are implemented
  _openOldDialog: function(ev) {
    this.killEvent(ev);
    this.options.openOldDialog();
    this.hide();
  }

});
