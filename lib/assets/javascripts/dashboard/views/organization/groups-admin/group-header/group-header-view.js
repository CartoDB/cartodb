const $ = require('jquery');
const CoreView = require('backbone/core-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const template = require('./group-header.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'urls'
];

/**
 * Header view when looking at details of a specific group.
 */
module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._group, 'change:display_name', this.render);
    this.listenTo(this._group.users, 'reset add remove', this.render);
  },

  render: function () {
    this._$orgSubheader().hide();

    const isNewGroup = this._group.isNew();
    const templateData = {
      backUrl: this._urls.root,
      title: this._group.get('display_name') || 'Create new group',
      isNewGroup: isNewGroup,
      usersUrl: false
    };

    if (isNewGroup) {
      templateData.editUrl = window.location;
      templateData.editUrl.isCurrent = true;
    } else {
      templateData.editUrl = this._urls.edit;
      templateData.usersUrl = this._urls.users;

      const usersCount = this._group.users.length;
      templateData.usersLabel = usersCount === 0 ? 'Users' : `${usersCount} ${pluralizeString('User', 'Users', usersCount)}`;

      if (!this._urls.users.isCurrent) {
        templateData.backUrl = this._urls.users;
      }
    }

    this.$el.html(template(templateData));
    return this;
  },

  _$orgSubheader: function () {
    return $('.js-org-subheader');
  },

  clean: function () {
    this._$orgSubheader().show();
    CoreView.prototype.clean.call(this);
  }
});
