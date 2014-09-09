
  /**
   *  Common data tables title
   *
   *  - It will change when model changes.
   *  - Only displays the title of the filtered tag or section.
   *
   */


  cdb.admin.CommonData.Title = cdb.core.View.extend({

    initialize: function() {
      this.template = cdb.templates.getTemplate(this.options.template || 'common_data/views/common_data_title');
      this._initBinds();
    },

    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this.render, this);
    }

  });