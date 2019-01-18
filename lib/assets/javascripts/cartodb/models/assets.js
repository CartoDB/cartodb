

  /*
   *  User asset Model
   */

  cdb.admin.Asset = cdb.core.Model.extend({
    
    defaults: {
      state:  'idle',
      name:   ''
    }

  });


  /*
   *  User assets Collection
   */

  cdb.admin.Assets = Backbone.Collection.extend({

    model: cdb.admin.Asset,

    url: function(method) {
      var version = cdb.config.urlVersion('asset', method);
      return '/api/' + version + '/users/' + this.user.id + '/assets'
    },

    initialize: function(models, opts) {
      this.user = opts.user;
    },

    parse: function(resp, xhr) {
      return resp.assets;
    }

  });


  /**
   *  Static assets
   *
   */

  cdb.admin.StaticAsset = cdb.admin.Asset.extend({

    defaults: {
      state:      'idle',
      public_url: '',
      kind:       'marker',
      name:       '',
      host:       'http://com.cartodb.users-assets.production.s3.amazonaws.com',
      folder:     'maki-icons',
      ext:        'svg',
      size:       '18'
    },

    toJSON: function() {
      var c = _.clone(this.attributes);
      c['public_url'] = this.get("host") + '/' + this.get("folder") + '/' + c['icon'] + (this.get("size") ? '-' + this.get("size") : '') + '.' + this.get("ext");
      return c;
    },
    
    get: function(attr) {
      var r = this.attributes[attr];

      if (attr === "public_url") {
        r = this.get("host") + '/' + this.get("folder") + '/' + this.attributes['icon'] + (this.get("size") ? '-' + this.get("size") : '') + '.' + this.get("ext");
      }

      return r;
    }

  });



  /*
   *  Static assets Collection
   */

  cdb.admin.StaticAssets = cdb.admin.Assets.extend({

    model: cdb.admin.StaticAsset,

    url: function() { return '' },

    initialize: function(models, opts) {},

    parse: function(resp, xhr) { return [] }

  });