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
  title: 'With link',
  desc: 'Anyone with the link can view, no password needed.'
}, {
  privacy: 'PASSWORD',
  illustrationType: 'alert',
  iconFontType: 'unlockWithEllipsis',
  title: 'Password-protected',
  desc: 'Anyone with the password can view.'
}, {
  privacy: 'PRIVATE',
  illustrationType: 'negative',
  iconFontType: 'lock',
  title: 'Private',
  desc: 'Only you can access.'
}];

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
    const canSelectPremiumOptions = user.get('actions')[ vis.isVisualization() ? 'private_maps' : 'private_tables' ];
    const currentPrivacy = vis.get('privacy');
    const availableOptions = vis.privacyOptions();

    return new this(
      _.chain(ALL_OPTIONS)
        .filter(function (option) {
          return _.contains(availableOptions, option.privacy);
        })
        .map(function (option) {
          // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
          return _.defaults({
            selected: option.privacy === currentPrivacy,
            disabled: !(option.alwaysEnable || canSelectPremiumOptions)
          }, option);
        })
        .value()
    );
  }
});
