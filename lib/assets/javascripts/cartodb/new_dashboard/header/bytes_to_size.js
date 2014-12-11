/**
 * Object representing human-readable version of a given number of bytes.
 *
 * (Extracted logic from an old dashboard view)
 *
 * @param bytes {Number}
 * @returns {Object}
 */
var fn = function(bytes) {
  if (!(this instanceof fn)) return new fn(bytes);

  this.bytes = bytes;
  if (bytes == 0) {
    this.unit = 0;
  } else {
    this.unit = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  }

  return this;
};

fn.prototype.size = function() {
  return (this.bytes / Math.pow(1024, this.unit));
};

fn.prototype.UNIT_SUFFIXES = ['B', 'kB', 'MB', 'GB', 'TB'];
fn.prototype.suffix = function() {
  return this.UNIT_SUFFIXES[this.unit];
};

fn.prototype.toString = function() {
  return this.size().toFixed(0) + this.suffix();
};

module.exports = fn;
