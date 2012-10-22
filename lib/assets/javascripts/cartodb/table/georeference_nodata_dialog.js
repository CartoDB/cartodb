cdb.admin.GeoreferenceNoDataDialog =  cdb.admin.BaseDialog.extend({

  // do not remove
  events: cdb.core.View.extendEvents({ }),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: 'You cannot georeference your data',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Hide",
      modal_type: "creation",
      modal_class: 'georeference_dialog',
      width: 572
    });
    this.constructor.__super__.initialize.apply(this);
  },


  render_content: function() {
    var $content = this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/geocoder_nodata_content');
    $content.append(temp_content);

    return $content;
  }
});