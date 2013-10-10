
  /**
   *  Import pane base view
   *
   *  - It could create modules for upload puposes.
   *  - It generates a ImportPaneModel by default.
   *
   *  new cdb.admin.ImportPane({
   *    template: cdb.templates.getTemplate('import_pane')
   *  });
   *
   */


  cdb.admin.ImportPane = cdb.core.View.extend({
    
    className: "import-pane",

    initialize: function() {
      this.model = new cdb.admin.ImportPaneModel();
    },

    render: function() {
      this.$el.append(this.template({chosen: this.options.chosen}));
      return this;
    },

    submitUpload: function() {
      cdb.log.info('import pane without upload function "submitUpload"')
    }
    
  });