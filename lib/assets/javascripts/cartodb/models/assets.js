

  /*
   *  User asset Model
   */

  cdb.admin.Asset = cdb.core.Model.extend({
    
    defaults: {
      state: 'idle'
    }

  });


  /*
   *  User assets Collection
   */

  cdb.admin.Assets = Backbone.Collection.extend({

    model: cdb.admin.Asset,

    url: function() {
      return '/api/v1/users/' + this.user.id + '/assets'
    },

    initialize: function(models, opts) {
      this.user = opts.user;
    },

    parse: function(resp, xhr) {
      return resp.assets;
    }

  });

