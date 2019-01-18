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
            this.trigger('moduleLoaded:' + model.get('name'));
          }, this);
        },

        //error track
        REPORT_ERROR_URL: '/api/v0/error',
        ERROR_TRACK_ENABLED: false,

        /**
         * returns the base url to compose the final url
         * http://user.carto.com/
         */
        getSqlApiBaseUrl: function() {
          var url;
          if (this.get('sql_api_template')) {
            url = this.get("sql_api_template").replace('{user}', this.get('user_name'));
          } else {
            url = this.get('sql_api_protocol') + '://' +
              this.get('user_name') + '.' +
              this.get('sql_api_domain') + ':' +
              this.get('sql_api_port');
          }
          return url;
        },

        /**
         * returns the full sql api url, including the api endpoint
         * allos to specify the version
         * http://user.carto.com/api/v1/sql
         */
        getSqlApiUrl: function(version) {
          version = version || 'v2';
          return this.getSqlApiBaseUrl() + "/api/" + version + "/sql";
        },

        /**
         *  returns the maps api host, removing user template
         *  and the protocol.
         *  carto.com:3333
         */
        getMapsApiHost: function() {
          var url;
          var mapsApiTemplate = this.get('maps_api_template');
          if (mapsApiTemplate) {
            url = mapsApiTemplate.replace(/https?:\/\/{user}\./, '');
          }
          return url;
        }

    });

    cdb.config = new Config();
    cdb.config.set({
      cartodb_attributions: "© <a href=\"https://carto.com/attributions\" target=\"_blank\">CARTO</a>",
      cartodb_logo_link: "http://www.carto.com"
    });

})();
