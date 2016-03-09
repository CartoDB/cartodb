var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');

var IS_PERSISTED_FLAG = '_is_persisted';

/**
 * Base model for an analysis model.
 * Expected to be extended
 */
module.exports = cdb.core.Model.extend({

  /**
   * @override {cdb.core.Model.prototype.sync} custom behavior for an update
   */
  sync: function (method, model, options) {
    if (!this.get(IS_PERSISTED_FLAG)) {
      if (method === 'delete') {
        // not persisted, so nothing to delete
        // do nothing but fulfill the API expectation i.e. return a (resolved) promise
        var jqXHR = $.Deferred();
        jqXHR.resolve();
        return jqXHR;
      }

      // Special case on first request for analysis;
      // method will be update since it has an id defined, force to create it instead of the persisted flag is not present
      if (method === 'update') {
        this.set(IS_PERSISTED_FLAG, true, { silent: true });
        method = 'create';
        var customURL = this.url().replace('/' + this.id, '');

        var originalError = options.error;
        var customError = function () {
          this.unset(IS_PERSISTED_FLAG);
          if (originalError) originalError.apply(this, arguments);
        }.bind(this);
        options = _.defaults(
          {
            url: customURL,
            error: customError
          },
          options
        );
      }
    }

    return cdb.core.Model.prototype.sync.call(this, method, model, options);
  }
});
