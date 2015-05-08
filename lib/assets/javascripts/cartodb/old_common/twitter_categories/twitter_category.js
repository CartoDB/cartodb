
  /**
   *  Twitter category item view
   *  - It just needs a twitter category model
   */

  cdb.common.TwitterCategory = cdb.core.View.extend({

    className: 'twitter-category',

    _MAX_CATEGORIES: 4,
    _MAX_TERMS: 29,

    events: {
      'focusout input.text':  '_onInputFocusOut',
      'focusin input.text':   '_onInputFocusIn',
      'keydown input.text':   '_onInputChange',
      'keypress input.text':  '_onInputChange',
      'keyup input.text':     '_onInputChange'
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('old_common/views/twitter_categories/twitter_category');
      this._initBinds();
    },

    render: function() {
      this.$el.append(
        this.template({
          terms: this.model.get('terms'),
          category: this.model.get('category'),
          counter: this.model.get('counter')
        })
      );

      // Show category
      this.show();

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onInputChange');
      this.model.bind('change:category', this._onCategoryChange, this);
    },

    _onCategoryChange: function() {
      this.$('input.category').val('Category ' + this.model.get('category'));
    },

    _onInputChange: function(e) {
      var value = $(e.target).val();

      // It was a ENTER key event? Send signal!
      if (e.keyCode === 13) {
        e.preventDefault();
        this.trigger('submit', this.model, this);
        return false;
      }

      // Check if it is possible to add new characters
      // if not, stop the action, unless user is deleting
      // any previous character
      if (( this.model.get('counter') === 0 || this.model.get('terms').length > this._MAX_TERMS) &&
        e.keyCode !== 37 /* left */ && e.keyCode !== 39 /* right */ && e.keyCode !== 8 && value.length > 0) {
        this.killEvent(e);
        this.trigger('limit', this.model, this);
        return false;
      } else {
        this.trigger('nolimit', this.model, this);
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