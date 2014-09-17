
  /**
   *  Aside for Common data section.
   * 
   *  - It will manage which view should be visible.
   *
   */

  cdb.admin.CommonData = {}; 
  cdb.admin.CommonData.Aside = cdb.core.View.extend({

    initialize: function() {
      this.collection = new cdb.admin.CommonData.CategoriesCollection();
      this.router = this.options.router;
      this.template = cdb.templates.getTemplate('common_data/views/common_data_aside');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template());
      
      if (this.collection.size() > 0) {
        // Init views
        this._initViews();
      } 
      
      // Show or hide it!
      // There is always at least one item, 'All' category
      this[ this.collection.size() > 1 ? 'show' : 'hide' ]();

      return this;
    },

    _initBinds: function() {
      this.model.bind('change:categories', this._onCategoriesChange, this);
    },

    _onCategoriesChange: function() {
      this.collection = this.model.get('categories');
      this.render();
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

      // Extra list
      var extra = new cdb.admin.CommonData.Extra({
        el:     this.$('ul.featured'),
        model:  this.router.model
      });

      extra.bind('extraClicked', this._onExtraClicked, this);

      extra.render();
      this.addView(extra);
    },

    _onExtraClicked: function(type, v) {
      this.router.navigate('/' + type, { trigger: true });
    },

    _onTagClicked: function(tag, v) {
      this.router.navigate('/' + tag, { trigger: true });
    }

  });