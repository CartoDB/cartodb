
  /**
   *  Background geocoder now extends from
   *  background importer
   */

  cdb.admin.BackgroundGeocoder = cdb.ui.common.BackgroundImporter.extend({

    // when the importer is a geocoder bind its stat
    bindGeocoder: function() {
      var self = this;

      this.import_.bind('started offline finished templateError error', function() {
        self.changeState(self.import_);
      }, this);

      this.import_.bind('progress', function() {
        self._setProgress();
      }, this);

      this.bind('canceled', function() {
        self.import_.cancel();
      });
    },

    // Show progress but don't render again
    // the whole component
    _setProgress: function() {
      var attrs = this.import_;
      this.$('label.count').text(attrs.total_connections + "/" + attrs.totalRegisters);
    }

  });
