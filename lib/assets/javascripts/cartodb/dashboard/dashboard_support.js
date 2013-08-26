
  /*
   *  Dashboard support block
   *
   *  - It will be displayed when user is not free
   */

  cdb.admin.Support = cdb.core.View.extend({

    initialize: function() {
      this.model.bind('change:actions', this._onActionsChange, this);
      this._onActionsChange();
    },

    _onActionsChange: function() {
      if (this.model.get('actions') && this.model.get('actions').dedicated_support) {
        this.show();
      } else {
        this.hide();
      }
    }
  })