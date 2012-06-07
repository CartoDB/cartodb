/**
 * global configuration 
 */

(function() {

    Config = Backbone.Model.extend({
        VERSION: 2,

        //error track
        REPORT_ERROR_URL: '/api/v0/error',
        ERROR_TRACK_ENABLED: false

    });

    cdb.config = new Config();

})();
