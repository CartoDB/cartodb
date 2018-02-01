const CoreView = require('backbone/core-view');
const template = require('./regenerate-keys.tpl');

module.exports = CoreView.extend({
  events: function () {
    return Object.assign({}, CoreView.prototype.events, {
      'click .js-ok': '_regenerateKeys'
    });
  },

  render: function () {
    return this.$el.html(
      template({
        type: this.options.type,
        scope: this.options.scope,
        form_action: this.options.form_action,
        authenticity_token: this.options.authenticity_token,
        method: this.options.method || 'post'
      })
    );
  },

  _regenerateKeys: function () {
    this.trigger('done');
    this.close();
  }
});
