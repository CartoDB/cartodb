

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


  /**
   *  Static assets
   *
   */

  cdb.admin.StaticAsset = cdb.admin.Asset.extend({

    defaults: {
      state:      'idle',
      public_url: '',
      kind:       'marker',
      name:       ''
    },

    options: {
      host: 'http://com.cartodb.users-assets.production.s3.amazonaws.com/maki-icons/',
      ext:  'svg',
      size: '18'
    },

    initialize: function(attrs, opts) {
      cdb.admin.Asset.prototype.initialize.call(this, attrs, opts);
      
      if (opts.ext) this.options.ext = opts.ext;
      if (opts.host) this.options.host = opts.host;
      if (opts.size) this.options.size = opts.size;
    },

    toJSON: function() {
      var c = _.clone(this.attributes);
      c['public_url'] = this.options.host + c['icon'] + '-' + this.options.size + '.' + this.options.ext;
      return c;
    },
    
    get: function(attr) {
      var r = this.attributes[attr];

      if (attr === "public_url") {
        r = this.options.host + this.attributes['icon'] + '-' + this.options.size + '.' + this.options.ext;
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