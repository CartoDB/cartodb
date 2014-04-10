
  /**
   *  Service item model + Service items collection
   *
   *  - It needs a datasource name or it won't work.
   *
   */

  
  cdb.admin.ServiceItem = cdb.core.Model.extend({
    
    defaults: {
      id: '',
      filename: '',
      checksum: '',
      service: '',
      size: '',
      title: ''
    }

  });


  cdb.admin.ServiceCollection = Backbone.Collection.extend({

    _DATASOURCE_NAME: 'dropbox',

    model: cdb.admin.ServiceItem,

    initialize: function(coll, opts) {
      if (opts.datasource_name) {
        this._DATASOURCE_NAME = opts.datasource_name;
      }
    },

    fetch: function() {
      this.trigger("fetch", this);

      // Pass through to original fetch.
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    },

    parse: function(r) {
      return r.files;
    },

    url: function() {
      return '/api/v1/imports/service/' + this._DATASOURCE_NAME + '/list_files'
    },

  });
