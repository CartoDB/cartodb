

  /*
   *  User assets Model
   */

  cdb.admin.Asset = cdb.core.Model.extend({

    initialize: function(opts) {
      this.user = opts.user;
    },

    urlRoot: function() {
      return '/api/v1/users/' +  this.user.id + '/assets';
    }

  });




  /*
   *  User assets Collection
   */

  cdb.admin.Assets = Backbone.Collection.extend({

    model: cdb.admin.Asset,

    initialize: function(opts) {
      this.user = opts.user;
    },

    url: function() {
      return '/api/v1/users/' +  this.user.id + '/assets';
    }

  });

