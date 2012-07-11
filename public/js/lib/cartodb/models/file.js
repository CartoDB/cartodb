

cdb.admin.File = Backbone.Model.extend({
    urlRoot: '/api/v1/upload'
});

cdb.admin.Files = Backbone.Collection.extend({
    url: '/api/v1/upload'
});

cdb.admin.Import = Backbone.Model.extend({

    idAttribute: 'item_queue_id',
    urlRoot: '/api/v1/imports',

    initialize: function() {
      this.bind('change', this._checkFinish, this);
    },

    /**
     * checks for poll to finish
     */
    pollCheck: function(i) {
      var self = this;
      var tries = 0;
      this.pollTimer = setInterval(function() {
        cdb.log.debug("checking job for finish: " + tries);
        self.fetch();
        ++tries;
      }, i || 1500);
    },

    _checkFinish: function() {
      if(this.get('state') === 'complete') {
        cdb.log.debug("job finished");
        clearInterval(this.pollTimer);
        this.trigger('importComplete');
      }
    }
});

cdb.admin.Imports = Backbone.Model.extend({
    url: '/api/v1/imports'
});
