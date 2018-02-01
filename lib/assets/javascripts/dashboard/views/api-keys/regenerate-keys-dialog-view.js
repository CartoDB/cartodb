const template = require('./regenerate-keys-dialog.tpl');
const BaseDialog = require('../../components/base-dialog-view');

module.exports = BaseDialog.extend({
  events: function () {
    return Object.assign({}, BaseDialog.prototype.events, {
      'click .js-ok': '_regenerateKeys'
    });
  },

  initialize: function () {
    this.elder('initialize'); // TODO: ¿?
  },

  render_content: function () {
    return template({
      type: this.options.type,
      scope: this.options.scope,
      form_action: this.options.form_action,
      authenticity_token: this.options.authenticity_token,
      method: this.options.method || 'post'
    });
  },

  _regenerateKeys: function () {
    this.trigger('done');
    this.close();
  }
});
