var cdb = require('cartodb.js');

/**
 * Represents a dashboard URL, defined by contentType (either datasets or maps).
 */
module.exports = cdb.core.Model.extend({

  toDefault: function() {
    return this._toStr();
  },
  
  toLocked: function() {
    return this._toStr('locked');
  },

  toShared: function() {
    return this._toStr('shared');
  },

  toLiked: function() {
    return this._toStr('liked');
  },

  /**
   * @protected
   */
  _toStr: function() {
    return this._toStrWithoutBasePath(this._basePath(), Array.prototype.slice.call(arguments, 0));
  },

  /**
   * @protected
   */
  _toStrWithoutBasePath: function() {
    var userUrl = this.get('userUrl');
    return userUrl._toStr.call(userUrl, Array.prototype.slice.call(arguments, 0));
  },

  /**
   * @private
   */
  _basePath: function() {
    return 'dashboard/' + this.get('contentType');
  }
});
