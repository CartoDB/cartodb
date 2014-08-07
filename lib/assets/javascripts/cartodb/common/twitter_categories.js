
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
        this._setCategoriesIndex()
        return false;
      }
    },

    // Set correct categories index
    _setCategoriesIndex: function() {

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

      setTimeout(function() {
        v.clean();
        v.model.destroy();
      }, 400);
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
      _.bindAll(this, '_onInputChange');
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