
  /**
   *  Empty section for common data
   *
   *  - It will be displayed when common data endpoint
   *    returns 0 visualizations.
   *
   */

  cdb.admin.CommonData.Empty = cdb.core.View.extend({

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this._onTablesFetched, this);
      this.add_related_model(this.collection);
    },

    _onTablesFetched: function() {
      if (this.collection.size() > 0) {
        this.hide();
      } else {
        this.show();
      }
    }

  })