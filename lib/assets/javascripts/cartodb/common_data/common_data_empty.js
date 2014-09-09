
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
      this.model.bind('change:categories', this._onTablesFetched, this);
    },

    _onTablesFetched: function() {
      if (this.model.get('datasets').size() > 0) {
        this.hide();
      } else {
        this.show();
      }
    }

  })