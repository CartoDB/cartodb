var cdb = require('cartodb.js');

/**
 * Represents a dashboard URL, defined by contentType (either datasets or maps).
 */
module.exports = cdb.core.Model.extend({

  toDefault: function() {
    return this._toStr();
  },
  
  

  _toStr: function() {
    var userUrl = this.get('userUrl');
    return userUrl.toStr.call(userUrl, 'dashboard', this.get('contentType'), Array.prototype.slice.call(arguments, 0));
  }
});
