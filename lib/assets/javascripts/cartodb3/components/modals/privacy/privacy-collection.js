var Backbone = require('backbone');
var PrivacyModel = require('./privacy-model');
var PasswordModel = require('./privacy-password-model');

/**
 * Collection that holds the different privacy options.
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, options) {
    if (attrs.privacy === 'PASSWORD') {
      return new PasswordModel(attrs, options);
    } else {
      return new PrivacyModel(attrs, options);
    }
  },

  initialize: function () {
    this.bind('change:selected', this._deselectLastSelected, this);
  },

  searchByPrivacy: function (privacy) {
    return this.findWhere({privacy: privacy});
  },

  selectedOption: function () {
    return this.find(function (option) {
      return option.get('selected');
    });
  },

  passwordOption: function () {
    return this.find(function (option) {
      return option.get('privacy') === 'PASSWORD';
    });
  },

  _deselectLastSelected: function (m, isSelected) {
    if (isSelected) {
      this.each(function (option) {
        if (option !== m) {
          option.set({selected: false});
        }
      });
    }
  }
});
