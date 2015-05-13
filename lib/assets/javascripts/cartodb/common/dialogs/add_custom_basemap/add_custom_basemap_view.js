var cdb = require('cartodb.js');
var _ = require('underscore');
var BaseDialog = require('../../views/base_dialog/view.js');
var randomQuote = require('../../view_helpers/random_quote.js');
var ViewFactory = require('../../view_factory.js');
var ViewModel = require('./add_custom_basemap_model.js');

var TABS = {
  xyz: require('./xyz_view')
};

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
    return cdb.templates.getTemplate('common/dialogs/add_custom_basemap/add_custom_basemap')({
      model: this.model
    });
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);

    this.model.get('tabs').each(function(tabModel) {
      var name = tabModel.get('name');
      this._panes.addTab(name,
        new TABS[name]({
          model: tabModel
        })
      );
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
    this._panes.active(this.model.get('currenTab'));
  },

  // TODO: Remove once all tabs are implemented
  _openOldDialog: function(ev) {
    this.killEvent(ev);
    this.options.openOldDialog();
    this.hide();
  }

});
