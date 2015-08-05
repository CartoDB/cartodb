var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');

/**
 *  Change privacy datasets/maps dialog.
 *
 */

module.exports = BaseDialog.extend({

  initialize: function() {
    this.user = this.options.user;
    this.elder('initialize');
    this._initViews();
  },
  
  render_content: function() {
    // return this._panes.getActivePane().render().el;
  },

  _initViews: function() {
    // this._panes = new cdb.ui.common.TabPane({
    //   el: this.el
    // });
    // this.addView(this._panes);
    // this._panes.addTab('start',
    //   new StartView({
    //     privacyOptions: this._privacyOptions,
    //     user: this.options.user,
    //     vis: this.options.vis
    //   })
    // );
    // this._panes.addTab('saving',
    //   ViewFactory.createByTemplate('common/templates/loading', {
    //     title: 'Saving privacy…',
    //     quote: randomQuote()
    //   }).render()
    // );
    // this._panes.addTab('saveFail',
    //   ViewFactory.createByTemplate('common/templates/fail', {
    //     msg: ''
    //   }).render()
    // );
    // this._panes.active('start');
  }

  
});
