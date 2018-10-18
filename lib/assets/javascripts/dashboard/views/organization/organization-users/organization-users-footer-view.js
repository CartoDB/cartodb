const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./organization-users-footer.tpl');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = CoreView.extend({

  className: 'Form-footer',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        seats: this.model.get('seats'),
        users: this.options.organizationUsers.totalCount(),
        newUserUrl: this.model.viewUrl().create(),
        upgradeUrl: window.upgrade_url,
        customHosted: this._configModel.isHosted()
      })
    );

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:total_users', this.render);
    this.listenTo(this.options.organizationUsers, 'sync', this.render);
  }
});
