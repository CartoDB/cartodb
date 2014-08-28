
  /**
   *  
   *
   *
   */
  
  cdb.admin.CommonData.Aside = cdb.core.View.extend({

    initialize: function() {
      this.template = cdb.templates.getTemplate('common_data/views/common_data_aside');
      this._initBinds();
    },

    render: function() {
      this.$el.append(this.template());

      // Init views
      this._initViews();
      // Show it!
      this.show();

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    },

    _initViews: function() {

    }

  });