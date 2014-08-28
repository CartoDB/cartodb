
  /**
   *  
   *
   *
   */


  cdb.admin.CommonData.Content = cdb.core.View.extend({

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      console.log("content");
      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    }

  });