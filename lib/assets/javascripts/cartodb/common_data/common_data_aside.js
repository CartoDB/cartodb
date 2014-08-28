
  /**
   *  
   *
   *
   */
  
  cdb.admin.CommonData.Aside = cdb.core.View.extend({

    initialize: function() {
      this.router = this.options.router;
      this.template = cdb.templates.getTemplate('common_data/views/common_data_aside');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.append(this.template());
      // Init views
      this._initViews();
      // Show it!
      this.show();

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    },

    _initViews: function() {
      // Tags list
      var tags = new cdb.admin.CommonData.Tags({
        el:         this.$('ul.tags'),
        collection: this.collection
      });

      tags.bind('tagClicked', this._onTagClicked, this);

      tags.render();
      this.addView(tags);

      // Latest list

    },

    _onTagClicked: function(tag, v) {
      this.router.navigate('/' + tag, { trigger: true });
    }

  });