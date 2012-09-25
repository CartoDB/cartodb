

cdb.admin.GeoreferenceDialog =  cdb.admin.BaseDialog.extend({

  // do not remove
  events: cdb.core.View.extendEvents({ }),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: 'Georeference your table',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Georeference",
      modal_type: "creation",
      modal_class: 'georeference_dialog',
      width: 600
    });
    this.constructor.__super__.initialize.apply(this);
    this.setWizard();
  },


  _fillColumnNames: function(el) {
    var columns = _(this.model.nonReservedColumnNames());
    var options = columns.map(function(o) { return "<option>" + o + "</option>"; }).join('\n');
    var lat = this.lat = el.find('#lat').append(options);
    var lon = this.lon = el.find('#lon').append(options);

    // smart selection .. JAJAJA
    if(columns.contains('lat')) {
      lat.val('lat');
    }
    if(columns.contains('latitude')) {
      lat.val('latitude');
    }

    if(columns.contains('lon')) {
      lon.val('lon');
    }
    if(columns.contains('longitude')) {
      lon.val('longitude');
    }
  },


  render_content: function() {
    var $content = this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/georeference_dialog');
    $content.append(temp_content);

    this._fillColumnNames($content);
    return $content;
  },

  ok: function() {
    // use lat/lon
    if(this.option == 0) { // dont not change by ===
      this.model.geocode_using(this.lat.val(), this.lon.val());
    } else {
      // geocoding using address
      if(this.option == 1) { // dont not change by ===
        this.options.geocoder.setAddress(this.$('.address input').val());
        this.options.geocoder.start();
      }
    }
  }

});
