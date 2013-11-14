/**
 * global configuration
 */

(function() {

    Config = Backbone.Model.extend({
        VERSION: 2,

        initialize: function() {
          this.modules = new Backbone.Collection();
          this.modules.bind('add', function(model) {
            this.trigger('moduleLoaded');
          }, this);
        },

        //error track
        REPORT_ERROR_URL: '/api/v0/error',
        ERROR_TRACK_ENABLED: false,

        getSqlApiUrl: function() {
          var url = this.get('sql_api_protocol') + '://' +
            this.get('user_name') + '.' +
            this.get('sql_api_domain') + ':' +
            this.get('sql_api_port');
          return url;
        }


    });

    cdb.config = new Config();

})();
