var cdb = require('cartodb.js-v3');

// Twitter category model

module.exports = cdb.core.Model.extend({

  _MAX_COUNTER: 1014,

  _CHAR_MAP: {
    ' ': 2,
    '-': 2,
    '_': 2,
    '.': 2
  },
  
  defaults: {
    terms:    [],
    category: '',
    counter:  1014
  },

  initialize: function() {
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:terms', this._setCounter, this);
  },

  _setCounter: function() {
    var count = this._MAX_COUNTER;
    var self = this;

    // Check terms number
    if (this.get('terms').length > 1) {
      count = count - ( ( this.get('terms').length - 1 ) * 4 )
    }

    // Check characters
    _.each(this.get('terms'), function(term) {
      _.each(term, function(c) {
        if (self._CHAR_MAP[c] !== undefined) {
          count = count - self._CHAR_MAP[c];
        } else {
          count--
        }
      });
    });

    // Count never should be fewer then 0 please!
    this.set('counter', Math.max(0,count));
  }

});
