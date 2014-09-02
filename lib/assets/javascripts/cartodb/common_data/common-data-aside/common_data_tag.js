    
  /**
   *  Filter tag item for common data aside
   *
   *  - It will trigger an event when it is clicked.
   *
   */
  
  cdb.admin.CommonData.Tag = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click': '_onTagClick'
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('common_data/views/common_data_tag');
      this._initBinds();
    },

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onTagClick');
      this.model.bind('change', this.render, this);
    },

    _onTagClick: function(e) {
      if (e) this.killEvent(e);
      var tag = $(e.target).attr('href').replace('#/', '');
      this.trigger('tagClicked', tag, this);
    }

  });

  