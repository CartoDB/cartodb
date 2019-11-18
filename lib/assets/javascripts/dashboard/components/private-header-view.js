const DashboardHeaderView = require('./dashboard-header-view');
const template = require('dashboard/components/dashboard-header/private-header.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'viewModel',
  'configModel'
];

module.exports = DashboardHeaderView.extend({
  className: 'Header CDB-Text',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.router = this.options.router;
    this._initBinds();
  },

  _initBinds: function () {
    DashboardHeaderView.prototype._initBinds.apply(this);
    this.model.bind('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    const hasOrganization = this.model.isInsideOrg();

    this.$el.html(
      template({
        organizationName: hasOrganization && this.model.organization.get('name'),
        nameOrUsername: this.model.nameOrUsername(),
        avatar: this.model.get('avatar_url'),
        homeUrl: this.model.viewUrl().dashboard(),
        isCartoDBHosted: this._configModel.get('cartodb_com_hosted')
      })
    );

    this._renderBreadcrumbsDropdownLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  }
});
