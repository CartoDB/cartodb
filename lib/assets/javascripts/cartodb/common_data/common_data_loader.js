  
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
      this.collection.bind('reset', this.hide, this);
      this.add_related_model(this.collection);
    }

  });
  