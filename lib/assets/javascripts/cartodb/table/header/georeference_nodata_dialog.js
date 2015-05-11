
  /**
   *  Shows a dialog when your data cannot be georeferenced
   *  
   *  - It needs at least a table model.
   *
   *  Example:
   *  
   *    var no_data_geo_dialog = new GeoreferenceNoDataDialog({
   *      table: table_model
   *    })
   *
   */

  cdb.admin.GeoreferenceNoDataDialog =  cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title: _t('There is no data left to georeference'),
      close: _t('Close')
    },

    // do not remove
    events: cdb.core.View.extendEvents({ }),

    initialize: function() {
      // dialog options
      _.extend(this.options, {
        title: this._TEXTS.title,
        template_name: 'old_common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.close,
        modal_type: "creation",
        modal_class: 'georeference_dialog',
        width: 572
      });
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      var temp_content = this.getTemplate('table/header/views/geocoder/geocoder_nodata_content');
      $content.append(temp_content);

      return $content;
    }
  });
