/**
* Encapsules the access to the sql API
*
*/
(function() {
  cdb.core.SqlApi = cdb.core.Model.extend({
    classLabel: 'cdb.core.SqlApi',
    defaults: {
      key: '',
      url: '',
      protocol: 'http://',
      tableName: ''
    },
    initialize: function(options) {
      this.elder('initialize');

      if(!options || options.useGlobals) {
        this.initializeFromGlobals();
      } else {
        this.initializeFromOptions(options)
      };

      this.log = [];
    },
    initializeFromOptions: function(options) {
      if (options && options.api_key) {
        this.set('key', options.api_key)
      };
      if (options && options.url){
        this.set('url', options.url)
      } else {
        throw "Invalid init options. You need to provide an URL"
      }
      if (options && options.tableName){
        this.set('tableName', options.tableName)
      }
    },
    initializeFromGlobals: function() {
      if(! window.config) {
        throw "window.config doesn't exists! please, provide some values to initialize the object"
      }
      var api_key = null;
      if(window.user_data) {
        api_key = user_data.api_key;
      }
      this.set({
        key: api_key,
        url: config.sql_api_domain + ':' + config.sql_api_port + config.sql_api_endpoint
      })
    },
    url: function() {
      var url = this.get('url');
      return this.get('protocol') + url + this.getParams();
    },
    getParams: function(extraParams) {
      var params = [];
      if(this.get('query')) {
        params.push("q=" + this.get('query'))
      };
      if(this.get('key')) {
        params.push("api_key=" + this.get('key'))
      }
      if(extraParams) {
        params.push(extraParams);
      }
      return '?' + params.join('&');
    },
    query: function(params) {
      this.log.append(this.url() + ' - ' + (new Date()));
      this.setQuery(params);
      this.fetch();
    },
    setQuery: function(params) {
      this.set({query: params});
    },
  });
})()
