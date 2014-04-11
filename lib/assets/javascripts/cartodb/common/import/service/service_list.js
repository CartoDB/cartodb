
  /**
   *  Import list from a service (such as Dropbox, GDrive, etc)
   *
   *
   *  new cdb.admin.ImportServiceList({ collection: service_collection })
   */

  cdb.admin.ImportServiceList = cdb.core.View.extend({

    _TEXTS: {
      empty: _t('No files with the required extensions are available in your account')
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$('ul').html('');

      // No items?
      if (this.collection.size() === 0) {
        this.$('ul').append($('<li>').addClass('empty').text(this._TEXTS.empty))
        return false;
      }

      // Render items
      this.collection.each(function(m){
        var v = new cdb.admin.ImportServiceItem({
          model: m
        });

        v.bind('fileSelected', this._fileSelected, this);

        this.$('ul').append(v.render().el);
        
        this.addView(v);
      }, this);

      // Add new custom scroll
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     this.$('ul'),
        parent: this.$el
      });

      this.addView(this.custom_scroll);

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    },

    _fileSelected: function(m) {
      this.trigger('fileSelected', m, this);
    }

  });