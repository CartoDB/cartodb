  
  /**
   *  Tag list for common data aside. 
   *
   */
  
  cdb.admin.CommonData.Tags = cdb.core.View.extend({

    render: function() {
      this.clearSubViews();

      this.$el.empty();

      this.collection.each(this._addTag, this);

      return this;
    },

    _addTag: function(m) {
      var tag = new cdb.admin.CommonData.Tag({ model: m });
      tag.bind('tagClicked', this._onTagClicked, this)
      this.$el.append( tag.render().el );
      this.addView(tag);
    },

    _onTagClicked: function(tag, v) {
      this.trigger('tagClicked', tag, this);
    }

  });