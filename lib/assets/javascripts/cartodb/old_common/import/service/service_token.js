
  /**
   *  Model to check if oAuth token is valid or not
   *
   *  - It needs a datasource name or it won't work.
   *
   *  new cdb.admin.Token({ datasource_name: 'dropbox' })
   */


  cdb.admin.ServiceToken = cdb.core.Model.extend({

    _DATASOURCE_NAME: 'dropbox',

    initialize: function(attrs, opts) {
      if (opts.datasource_name) {
        this._DATASOURCE_NAME = opts.datasource_name;
      }
    },

    url: function(method) {
      var version = cdb.config.urlVersion('imports_service', method);
      return '/api/' + version + '/imports/service/' + this._DATASOURCE_NAME + '/token_valid'
    },

    parse: function(r) {
      return r
    }

  });
