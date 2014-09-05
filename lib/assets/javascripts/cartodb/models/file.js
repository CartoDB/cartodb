

cdb.admin.File = cdb.core.Model.extend({
    urlRoot: '/api/v1/upload'
});

cdb.admin.Files = Backbone.Collection.extend({
    url: '/api/v1/upload'
});

cdb.admin.Import = cdb.core.Model.extend({

  idAttribute: 'item_queue_id',
  
  urlRoot: '/api/v1/imports',

  initialize: function() {
    this.bind('change', this._checkFinish, this);
  },

  setUrlRoot: function(urlRoot) {
    this.urlRoot = urlRoot;
  },

  /**
   * checks for poll to finish
   */
  pollCheck: function(i) {
    var self = this;
    var tries = 0;
    this.pollTimer = setInterval(function() {
      // cdb.log.debug("checking job for finish: " + tries);
      self.fetch({
        error: function(e) {
          self.trigger("change");
        }
      });
      ++tries;
    }, i || 1500);
  },

  destroyCheck: function() {
    clearInterval(this.pollTimer);
  },

  _checkFinish: function() {
    // cdb.log.info("state: " + this.get('state'), "success: " + this.get("success"));

    if(this.get('success') === true) {
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


cdb.admin.Imports = cdb.core.Model.extend({
  url: '/api/v1/imports',

  initialize: function() {
    this.bind('change', this._checkImports, this);
    this.activeImports;       // Active imports
    this.failedImports = [];  // Failed imports
    this.lastImport;          // Last import being checked 
  },

  /**
   * checks for poll to finish
   */
  pollCheck: function(i) {
    var self = this;
    var tries = 0;
    this.pollTimer = setInterval(function() {
      // cdb.log.debug("checking imports: " + tries);
      self.fetch({
        error: function(e) {
          self.trigger("change");
        }
      });
      ++tries;
    }, i || 2000);
  },

  destroyCheck: function() {
    clearInterval(this.pollTimer);
  },

  _checkImports: function() {

    // Check if there will be any imports
    if (_.size(this.get("imports")) == 0 && !this.activeImports) {
      this.trigger("importsEmpty");
      // Stop poll
      this.destroyCheck();
      return false;
    }

    // Save imports if we don't have active imports "filled"
    if (!this.activeImports) {
      this.activeImports = this.get("imports");
      this.trigger("importsStart");
    }

    if (this.get("imports").length == 0 &&
        this.activeImports.length == 0) {
      // Stop poll
      this.destroyCheck();
      
      // Trigger error event if there was any
      if (this.failedImports.length > 0) {
        // Sending all failed imports
        this.trigger("importsFailed", this.failedImports);  
      } else {
        // Trigger finished event
        this.trigger("importsFinished", this.lastImport);
      }
    } else if (this.activeImports.length != this.get("imports").length) {
      // Check if there is any difference between imports from back-end
      // and our active imports (item_queue_id)
      // if we are not checking any single import, check first

      var completed_imports = _.difference(this.activeImports, this.get("imports"));

      if (!this.lastImport && completed_imports.length > 0) {
        this._checkImport(completed_imports[0]);
      }
    }
  },

  _checkImport: function(item_queue_id) {
    this.lastImport = new cdb.admin.Import({ item_queue_id: item_queue_id });

    var self = this;

    this.lastImport.bind("importComplete", function(e){
      // Remove this import from active :)
      var queue_id = self.lastImport.get("item_queue_id");
      self._removeImport(queue_id);
    },this).bind("importError", function(e){
      // Add this import to failed imports :(
      self.failedImports.push(self.lastImport);
      // Reset import
      var queue_id = self.lastImport.get("item_queue_id");
      self._removeImport(queue_id);
    },this);

    this.lastImport.pollCheck();
  },

  _removeImport: function(queue_id) {
    this.lastImport.unbind();
    // Remove it from activeImports
    this.activeImports = _.filter(this.activeImports, function(import_queue){ return import_queue != queue_id; });
    // Check imports due to the fact that is possible
    // to not have any more imports in the queue
    this._checkImports();
  }
});
