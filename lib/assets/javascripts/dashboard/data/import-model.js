const Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  idAttribute: 'item_queue_id',

  urlRoot: '/api/v1/imports',

  initialize: function () {
    this.bind('change', this._checkFinish, this);
  },

  setUrlRoot: function (urlRoot) {
    this.urlRoot = urlRoot;
  },

  /**
   * checks for poll to finish
   */
  pollCheck: function (i) {
    var self = this;
    this.pollTimer = setInterval(function () {
      // cdb.log.debug("checking job for finish: " + tries);
      self.fetch({
        error: function (e) {
          self.trigger('change');
        }
      });
    }, i || 1500);
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
  },

  _checkFinish: function () {
    // cdb.log.info("state: " + this.get('state'), "success: " + this.get("success"));

    if (this.get('success') === true) {
      // cdb.log.debug("job finished");
      clearInterval(this.pollTimer);
      this.trigger('importComplete', this);
    } else if (this.get('success') === false) {
      // cdb.log.debug("job failure");
      clearInterval(this.pollTimer);
      this.trigger('importError', this);
    } else {
      this.trigger('importChange', this);
    }
  }
});
