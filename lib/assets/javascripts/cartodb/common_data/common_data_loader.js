  
  /**
   *  Common data huge loader
   *
   */
  
  cdb.admin.CommonData.Loader = cdb.core.View.extend({

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      return this;
    },

    _initBinds: function() {
      this.model.bind('change:categories', this.hide, this);
    }

  });
  