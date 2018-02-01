/**
 * Object representing human-readable version of a given number of bytes.
 *
 * (Extracted logic from an old dashboard view)
 *
 * @param bytes {Number}
 * @returns {Object}
 */
var ByteToSize = function(bytes) {
  if (!(this instanceof ByteToSize)) return new ByteToSize(bytes);

  this.bytes = bytes;
  if (bytes == 0) {
    this.unit = 0;
  } else {
    this.unit = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  }

  return this;
};

ByteToSize.prototype.size = function () {
  return (this.bytes / Math.pow(1024, this.unit));
};

ByteToSize.prototype.UNIT_SUFFIXES = ['B', 'kB', 'MB', 'GB', 'TB'];
ByteToSize.prototype.suffix = function() {
  return this.UNIT_SUFFIXES[this.unit];
};

ByteToSize.prototype.toString = function(decimals) {
  var size = this.size();
  if (decimals) {
    // 1 decimal: 9.995 => 9.9
    var round = Math.pow(10, decimals);
    size = Math.floor(size * round) / round;
  } else {
    size = Math.floor(size);
  }
  return size + this.suffix();
};

module.exports = ByteToSize;
