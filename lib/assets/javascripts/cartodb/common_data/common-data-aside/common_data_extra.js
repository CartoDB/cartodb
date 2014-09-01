  
  /**
   *
   *
   */

  cdb.admin.CommonData.Extra = cdb.core.View.extend({

    events: {
      'click .latest': '_onLatestClicked'
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('common_data/views/common_data_extra');
      this._initBinds();
    },

    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onLatestClicked');
      this.model.bind('change', this.render, this);
    },

    _onLatestClicked: function(e) {
      if (e) this.killEvent(e);
      this.trigger('extraClicked', 'latest', this);
    }

  })