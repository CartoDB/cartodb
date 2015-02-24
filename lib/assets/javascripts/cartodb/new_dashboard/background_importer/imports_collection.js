var Backbone = require('backbone');
var _ = require('underscore');
var pollTimer = 30000;
var ImportsModel = require('../../new_dashboard/background_importer/imports_model');

/** 
 *  Imports collection
 *    
 *  If it is fetched, it will add the import 
 *
 */

module.exports = Backbone.Collection.extend({

  model: ImportsModel,
  
  url: '/api/v1/imports',

  initialize: function(mdls, opts) {
    this.user = opts.user;
  },

  parse: function(r) {
    var self = this;

    if (r.imports.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.imports, function(id) {

        // Check if that import exists...
        var imports = self.filter(function(mdl){ return mdl.imp.get('item_queue_id') === id });

        if (imports.length === 0) {
          self.add(new ImportsModel({ id: id }, { user: self.user } ));
        }
      });
    }

    return this.models
  },

  pollCheck: function(i) {
    if (this.pollTimer) return;
    
    var self = this;
    this.pollTimer = setInterval(function() {
      self.fetch();
    }, pollTimer || 2000);

    // Start doing a fetch
    self.fetch();
  },

  destroyCheck: function() {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  }

});