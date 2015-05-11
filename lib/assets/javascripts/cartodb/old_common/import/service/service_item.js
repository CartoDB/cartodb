
  /**
   *  Item for rendering service data (such as Dropbox, GDrive, etc)
   *
   *  - It doesn't need any new paramater or option, just the model
   *    to render.  
   *
   *  new cdb.admin.ImportServiceItem()
   */


  cdb.admin.ImportServiceItem = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a': '_selectFile'
    },

    initialize: function() {
      _.bindAll(this, '_selectFile');
      this.template = this.options.template || cdb.templates.getTemplate('old_common/views/import/import_service_item');
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    _selectFile: function(e) {
      if (e) this.killEvent(e);
      this.trigger('fileSelected', this.model, this);
    }

  });