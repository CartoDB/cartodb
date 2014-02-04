
// error reporting module
// tracks errors raised by window.onerror and cdb.log.error and
// sends it to the server
//
// to enable it just:
// cdb.admin.ErrorReport.enable()


(function() {

  // extend Error to send the data to the server
  var Error = cdb.core.Error.extend({

    sql: function() {
      var attrs = [];
      var self = this;
      _.each(['msg', 'url', 'line', 'browser'], function(a) {
        attrs.push(String(self.attributes[a]));
      });
      var values = attrs.map(function(a) {
        return "'" + a.replace("'", "''") + "'";
      }).join(',');
      return "select cdb_error_track(" + values + ")";
    },

    sync: function(method, model, options) {
      options = options || {};
      if (method === 'create') {
        var host = cdb.config.get('error_track_url');
        $.ajax({
          type: "POST",
          url: host,
          data: "q=" + this.sql(),
          success: options.success,
        });
      }
    }
  });

  // disable/enable 
  function ErrorReport() {
  }

  ErrorReport.enable = function() {
    var host = cdb.config.get('error_track_url');
    // enable for 10% os users
    if(Math.random() > (cdb.config.get('error_track_percent_users') || 0)*0.01) {
      return false;
    }
    if (host && host.length) {
      cdb.config.ERROR_TRACK_ENABLED = true;
      cdb.errors.enableTrack();
      cdb.core.ErrorList.prototype.model = Error;
      return true;
    }
    return false;
  };

  ErrorReport.disable = function() {
    cdb.config.ERROR_TRACK_ENABLED = false;
    cdb.core.ErrorList.prototype.model = cdb.core.Error;
  };


  // export
  cdb.admin.ErrorReport = ErrorReport;

})();
