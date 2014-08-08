
  /**
   *  Twitter category list view
   *  - It will generate a collection to store all the 
   *    terms added.
   */

  cdb.common.TwitterCategories = cdb.core.View.extend({

    _MAX_CATEGORIES: 4,

    initialize: function() {
      // Add a first empty model
      var m = this._generateCategory();
      this.collection = new cdb.common.TwitterCategories.Collection([ m ]);

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.collection.each(this._addCategory, this);
      return this;
    },

    _initBinds: function() {
      this.collection.bind('change', this._manageCategories, this);
      this.collection.bind('change', this._onCategoryChange, this);
    },

    _manageCategories: function() {
      var self = this;
      var collection_size = this.collection.size();

      // Check if already created models are completed
      var nonFilled = this.collection.filter(function(m) {
        return m.get('terms').length === 0
      });

      // if so, generate new one
      if (nonFilled.length === 0 && collection_size < this._MAX_CATEGORIES) {
        var m = this._generateCategory();
        this.collection.add(m);
        this._addCategory(m);
        return false;
      }

      // else, let's check
      if (nonFilled.length > 0) {
        var m = _.first(nonFilled);
        var v = _.find(this._subviews, function(view){ return m.cid === view.model.cid });
        var pos = v.$el.index();
        
        // Only one item in the collection, do nothing
        if (collection_size === 1) return false;

        // If it is the last item but there is no more items, do nothing
        if (pos === (collection_size - 1)) return false;

        // If it is not the last item and there is another non-filled element
        // let's remove that one.
        if (pos !== (collection_size - 1) && nonFilled.length > 1) {
          m = nonFilled[1];
          v = _.find(this._subviews, function(view){ return m.cid === view.model.cid });
          this._removeCategory(v);
        }

        // Reorder category indexes :(
        this._setCategoryIndex();
      }
    },

    // Set proper index after any category removed
    _setCategoryIndex: function() {
      var self = this;

      // Hack to set properly category numbers
      this.$('.twitter-category').each(function(i,el) {
        var category = $(el).find('input.category').val();

        if (category !== ( 'Category ' + (i+1) )) {
          // Find model
          var m = self.collection.find(function(m) { return m.get('category') === category });
          // Find view
          m.set('category', 'Category ' + (i+1));
        }
        
      })
    },

    _generateCategory: function() {
      return new cdb.common.TwitterCategories.Model({
        terms: [],
        category: 'Category ' + (this.collection ? ( this.collection.size() + 1 ) : 1 )
      });
    },

    _addCategory: function(m) {
      var category = new cdb.common.TwitterCategory({ model: m });
      category.bind('submit', this._onCategorySubmit, this);
      this.$el.append(category.render().el);
      this.addView(category);
    },

    _removeCategory: function(v) {
      v.hide();
      v.clean();
      v.model.destroy();
    },

    _onCategorySubmit: function() {
      this.trigger('submitCategory', this.collection.toJSON(), this);
    },

    _onCategoryChange: function() {
      this.trigger('changeCategory', this.collection.toJSON(), this);
    }

  });



  /**
   *  Twitter category item view
   *  - It just needs a twitter category model
   */

  cdb.common.TwitterCategory = cdb.core.View.extend({

    className: 'twitter-category',

    _MAX_CATEGORIES: 4,

    _TEMPLATE: '<i class="twitter-icon"></i> \
                <input type="text" class="long terms text" value="<%= terms.join(",") %>" placeholder="' + _t('Insert your terms separated by commas') + '"/> \
                <input type="text" class="short category text" value="<%= category %>" placeholder="' + _t('Assign a category') + '" readonly tabindex="-1" />',

    events: {
      'focusout input.text': '_onInputFocusOut',
      'focusin input.text': '_onInputFocusIn',
      'keyup input.text': '_onInputChange'
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.$el.append(
        _.template(this._TEMPLATE)({
          terms: this.model.get('terms'),
          category: this.model.get('category')
        })
      );
      this.show();
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onInputChange');
      this.model.bind('change:category', this._onCategoryChange, this)
    },

    _onCategoryChange: function() {
      this.$('input.category').val(this.model.get('category'));
    },

    _onInputChange: function(e) {

      // It was a ENTER key event? Send signal!
      if (e.keyCode === 13) {
        e.preventDefault();
        this.trigger('submit', this.model, this);
        return false;
      }

      var $input = $(e.target);
      var type = $input.hasClass('terms') ? 'terms' : 'category';
      var value = $input.val();
      var d = {};

      // Get valid terms array
      if (type === "terms") {
        if (!value) {
          value = [];
        } else {
          value = value.split(',');
        }
      }

      d[type] = value;

      this.model.set(d);
    },

    _onInputFocusOut: function() {
      this.$el.removeClass('focus')
    },

    _onInputFocusIn: function() {
      this.$el.addClass('focus')
    },

    show: function() {
      this.$el.addClass('enabled');
    },

    hide: function() {
      this.$el.removeClass('enabled');
    }

  });


  
  // Twitter categories collection
  cdb.common.TwitterCategories.Collection = Backbone.Collection.extend({
    model: cdb.common.TwitterCategories.Model
  });


  // Twitter categories model
  cdb.common.TwitterCategories.Model = cdb.core.Model.extend({
    defaults: {
      terms:    [],
      category: ''
    }
  });