var cdb = require('cartodb.js-v3');
var StartView = require('./start_view');
var PrivacyOptions = require('./options_collection');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');
var ShareView = require('./share/share_view');

/**
 * Change privacy datasets/maps dialog.
 */
var ChangePrivacyView = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    this._privacyOptions = PrivacyOptions.byVisAndUser(this.options.vis, this.options.user);
    this._initViews();
    this._initBinds();
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  ok: function() {
    var selectedOption = this._privacyOptions.selectedOption();
    if (!selectedOption.canSave()) {
      return;
    }

    var self = this;
    this._panes.active('saving');
    selectedOption.saveToVis(this.options.vis, {
      success: function() {
        self.close();
      },
      error: function() {
        self._panes.active('saveFail');
      }
    });
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('start',
      new StartView({
        privacyOptions: this._privacyOptions,
        user: this.options.user,
        vis: this.options.vis
      })
    );
    this._panes.addTab('saving',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Saving privacy…',
        quote: randomQuote()
      }).render()
    );
    this._panes.addTab('saveFail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );
    this._panes.active('start');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
    this._panes.getPane('start').bind('clickedShare', this._openShareDialog, this);
  },

  _openShareDialog: function() {
    var view = new ShareView({
      clean_on_hide: true,
      enter_to_confirm: true,
      user: this.options.user,
      vis: this.options.vis,
      ChangePrivacyView: ChangePrivacyView
    });

    // Order matters, close this dialog before appending the share one, for side-effects to work as expected (body.is-inDialog)
    this.close();
    view.appendToBody();
  }
});

module.exports = ChangePrivacyView;
