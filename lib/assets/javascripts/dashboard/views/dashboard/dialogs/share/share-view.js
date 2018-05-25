const CoreView = require('backbone/core-view');
const DashboardShareViewContent = require('dashboard/views/dashboard/dialogs/share/share-view-content');
const shareHeaderTemplate = require('./share-header.tpl');
const shareFooterTemplate = require('./share-footer.tpl');
const ViewFactory = require('builder/components/view-factory');
const loadingView = require('builder/components/loading/render-loading');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'visModel',
  'modalModel',
  'modals',
  'onClose'
];

/**
 * Dialog to share item with other users in organization.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content content is-newContent Dialog-content--expanded',

  events: {
    'click .js-back': 'cancel',
    'click .cancel': 'cancel',
    'click .ok': 'ok'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._organization = this._userModel.organization;
  },

  render: function () {
    this.$('.content').addClass('Dialog-content--expanded');

    this.dashboardShareViewContent = new DashboardShareViewContent({
      className: 'Dialog-expandedSubContent',
      configModel: this._configModel,
      currentUserId: this._userModel.get('id'),
      organization: this._userModel.organization,
      visDefinitionModel: this._visModel
    });

    this.$el.append([
      shareHeaderTemplate({
        name: this._visModel.get('name')
      }),
      this.dashboardShareViewContent.render().el,
      shareFooterTemplate()
    ]);

    return this;
  },

  cancel: function () {
    this._modalModel.destroy();
    this._onClose();
  },

  // @implements cdb.ui.common.Dialog.prototype.ok
  ok: function () {
    const modalModel = this._modals.create(function (modalModel) {
      return ViewFactory.createByHTML(loadingView({}));
    });

    this.dashboardShareViewContent.saveACLPermissions()
      .done(() => {
        modalModel.destroy();
        this._modalModel.destroy();
        this._onClose();
      });
  }

});
