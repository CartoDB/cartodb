var Backbone = require('backbone');
var _ = require('underscore');
var TERMS_CHARS = 4;

// Twitter category model

module.exports = Backbone.Model.extend({
  _MAX_COUNTER: 1014,

  _CHAR_MAP: {
    ' ': 2,
    '-': 2,
    '_': 2,
    '.': 2
  },

  defaults: {
    terms: [],
    category: '',
    counter: 1014
  },

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:terms', this._setCounter, this);
  },

  _setCounter: function () {
    var count = this._MAX_COUNTER;
    var self = this;

    // Check terms number
    if (this.get('terms').length > 1) {
      count = count - ((this.get('terms').length - 1) * TERMS_CHARS);
    }

    // Count characters
    _.each(this.get('terms'), function (term) {
      _.each(term, function (c) {
        if (self._CHAR_MAP[c] !== undefined) {
          count = count - self._CHAR_MAP[c];
        } else {
          count--;
        }
      });
    });

    // Count never should be less than 0 please!
    this.set('counter', Math.max(0, count));
  }

});
