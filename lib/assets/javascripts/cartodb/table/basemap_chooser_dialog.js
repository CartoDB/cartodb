(function() {
  /**
   * shows a dialog to choose another base map
   * new BaseMapChooser({
   
   * })
   * 
   */
  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({

    // events: cdb.core.View.extendEvents(),

    initialize: function() {
      var self = this;

      _.extend(this.options, {
        title: _t("Add your basemap"),
        description: _t('Insert below the tileJSON URL of your basemaps.'),
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey",
        ok_title: _t("Add basemap"),
        modal_type: "compressed",
        width: 512,
        modal_class: 'basemap_chooser_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },


    render_content: function() {
      return this.getTemplate('table/views/basemap_chooser_dialog')();
    }
  });


})();
