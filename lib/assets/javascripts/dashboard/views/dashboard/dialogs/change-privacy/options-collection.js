const Backbone = require('backbone');
const _ = require('underscore');
const OptionModel = require('./option-model');
const PasswordOptionModel = require('./password-option-model');

/**
 * type property should match the value given from the API.
 */
const ALL_OPTIONS = [{
  privacy: 'PUBLIC',
  illustrationType: 'positive',
  iconFontType: 'unlock',
  title: 'Public',
  desc: 'Anyone can find and view.',
  alwaysEnable: true
}, {
  privacy: 'LINK',
  illustrationType: 'alert',
  iconFontType: 'unlock',
  title: 'Public - With Link',
  desc: 'Only those with the link can view.'
}, {
  privacy: 'PASSWORD',
  illustrationType: 'alert',
  iconFontType: 'unlockWithEllipsis',
  title: 'Public - With Password',
  desc: 'Only those who know the password can access.'
}, {
  privacy: 'PRIVATE',
  illustrationType: 'negative',
  iconFontType: 'lock',
  title: 'Private',
  desc: 'Only you can access.'
}];

function canChangeToPrivate (userModel, currentPrivacy, option) {
  return currentPrivacy !== 'PRIVATE' && option.privacy === 'PRIVATE' && userModel.hasRemainingPrivateMaps();
}

function canChangeToPublic (userModel, currentPrivacy, option) {
  return currentPrivacy !== 'PRIVATE' || currentPrivacy === 'PRIVATE' && option.privacy !== 'PRIVATE' && userModel.hasRemainingPublicMaps();
}

/**
 * Collection that holds the different privacy options.
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, options) {
    if (attrs.privacy === 'PASSWORD') {
      return new PasswordOptionModel(attrs, options);
    } else {
      return new OptionModel(attrs, options);
    }
  },

  initialize: function () {
    this.bind('change:selected', this._deselectLastSelected, this);
  },

  selectedOption: function () {
    return this.find(option => option.get('selected'));
  },

  passwordOption: function () {
    return this.find(option => option.get('privacy') === 'PASSWORD');
  },

  _deselectLastSelected: function (m, isSelected) {
    if (isSelected) {
      this.each(function (option) {
        if (option !== m) {
          option.set({selected: false}, {silent: true});
        }
      });
    }
  }

}, { // Class properties:

  /**
   * Get a privacy options collection from a Vis model
   *
   * Note that since the user's permissions should change very seldom, it's reasonable to assume they will be static for
   * the collection's lifecycle, so set them on the models attrs when creating the collection.
   * collection is created.
   *
   * @param vis {Object} instance of cdb.admin.Visualization
   * @param user {Object} instance of cdb.admin.User
   * @returns {Object} instance of this collection
   */
  byVisAndUser: function (vis, user) {
    const isVisualization = vis.isVisualization();
    const canSelectPremiumOptions = user.get('actions')[ isVisualization ? 'private_maps' : 'private_tables' ];
    const currentPrivacy = vis.get('privacy');
    const availableOptions = vis.privacyOptions();
    let publicSharingIsDisabled = isVisualization ? user.hasPublicMapSharingDisabled() : user.hasPublicDatasetSharingDisabled();

    return new this(
      _.chain(ALL_OPTIONS)
        .filter(function (option) {
          return _.contains(availableOptions, option.privacy);
        })
        .map(function (option) {
          // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
          var privacyEnabled = (option.privacy === 'PRIVATE'
            ? canChangeToPrivate(user, currentPrivacy, option)
            : canChangeToPublic(user, currentPrivacy, option));

          var DEFAULT_ENABLEMENT_FOR_TABLE = true;
          var premiumEnabled = isVisualization ? (canSelectPremiumOptions && privacyEnabled) : DEFAULT_ENABLEMENT_FOR_TABLE;

          var publicMustBeDisabled = (option.privacy !== 'PRIVATE' && publicSharingIsDisabled);

          var enabled = (option.alwaysEnabled || premiumEnabled) && !publicMustBeDisabled;

          return _.defaults({
            selected: option.privacy === currentPrivacy,
            disabled: !enabled
          }, option);
        })
        .value()
    );
  }
});
