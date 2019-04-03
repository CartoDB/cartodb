/**
 * Simple value object that holds everything need to instantiate a map using the Maps API
 */
var Request = function (payload, params, options) {
  this.payload = payload;
  this.params = params;
  this.options = options;
};

Request.prototype.toHashCode = function () {
  return JSON.stringify(this.payload) + JSON.stringify(this.params) + JSON.stringify(this.options);
};

Request.prototype.equals = function (request) {
  return this.toHashCode() === request.toHashCode();
};

module.exports = Request;
