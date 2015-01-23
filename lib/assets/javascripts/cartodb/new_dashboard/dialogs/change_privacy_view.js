var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var _ = require('underscore');
var PrivacyOptions = require('./change_privacy/options_collection');

var DISABLED_SAVE_CLASS_NAME = 'is-disabled';

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-option' : '_selectOption',
      'click .js-ok' : '_save',
      'keyup .js-password-input' : '_updatePassword',
      'blur .js-password-input' : 'render' // make sure the view is consistently rendered after writing password
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/template');
    this.vis = this.options.vis; // of model cdb.admin.Visualization
    this.user = this.options.user;
    this.upgradeUrl = this.options.upgradeUrl;
    this.options = PrivacyOptions.byVisAndUser(this.vis, this.user);

    this.options.bind('change', this.render, this);
    this.add_related_model(this.options);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    var pwdOption = this.options.passwordOption();
    var selectedOption = this.options.selectedOption();

    return this.template({
      itemName: this.vis.get('name'),
      options: this.options,
      showPasswordInput: pwdOption === selectedOption,
      pwdOption: pwdOption,
      saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
      showUpgradeBanner: !!this.upgradeUrl && this.options.any(function(option) { return !!option.get('disabled'); }),
      upgradeUrl: this.upgradeUrl
    });
  },
  
  cancel: function() {
    this.clean();
  },
  
  _selectOption: function(ev) {
    var option = this.options.at( $(ev.target).closest('.js-option').attr('data-index') );
    if (!option.get('disabled')) {
      option.set('selected', true);
    }
  },
  
  _updatePassword: function(ev) {
    // Reflect state directly in DOM instead of re-rendering to avoid loosing the focus on input
    var pwd = ev.target.value;
    this.options.passwordOption().set({ password: pwd }, { silent: true });
    this.$('.js-ok')[ _.isEmpty(pwd) ? 'addClass' : 'removeClass' ](DISABLED_SAVE_CLASS_NAME);
  },

  _save: function(ev) {
    var selectedOption = this.options.selectedOption();
    if (selectedOption.canSave()) {
      this.killEvent(ev);
      this.undelegateEvents();

      selectedOption.saveToVis(this.vis)
        .done(this.close.bind(this))
        .fail(this.delegateEvents.bind(this));
    }
  }
});
