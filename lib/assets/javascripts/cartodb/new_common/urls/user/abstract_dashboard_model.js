var cdb = require('cartodb.js');

/**
 * Represents a dashboard URL, defined by contentType (either datasets or maps).
 */
module.exports = cdb.core.Model.extend({

  toDefault: function() {
    return this._toStr();
  },

  /**
   * @protected
   */
  _toStr: function() {
    return this._toStrWithoutBasePath(this._basePath(), arguments);
  },

  /**
   * @protected
   */
  _toStrWithoutBasePath: function() {
    var userUrl = this.get('userUrl');
    return userUrl.toStr.call(userUrl, Array.prototype.slice.call(arguments, 0));
  },

  /**
   * @private
   */
  _basePath: function() {
    return 'dashboard/' + this.get('contentType');
  }
});
