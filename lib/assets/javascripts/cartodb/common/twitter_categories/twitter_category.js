
  /**
   *  Twitter category item view
   *  - It just needs a twitter category model
   */

  cdb.common.TwitterCategory = cdb.core.View.extend({

    className: 'twitter-category',

    _MAX_CATEGORIES: 4,

    events: {
      'focusout input.text':  '_onInputFocusOut',
      'focusin input.text':   '_onInputFocusIn',
      'keydown input.text':   '_onInputChange',
      'keypress input.text':  '_onInputChange',
      'keyup input.text':     '_onInputChange'
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('common/views/twitter_categories/twitter_category');
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

      // Add necessary views
      this._initViews();

      // Show category
      this.show();
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onInputChange');
      this.model.bind('change:category', this._onCategoryChange, this);
      this.model.bind('change:counter', this._onCounterChange, this);
    },

    _initViews: function() {
      // Tooltip
      var tooltip = new cdb.common.TipsyTooltip({
        el: this.$('.counter-label')
      });
      this.addView(tooltip);
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

      // Check if it is possible to add new characters
      // if not, stop the action, unless user is removing
      // any previous character
      if (this.model.get('counter') === 0 && e.keyCode !== 8) {
        this.killEvent(e);
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

    _onCounterChange: function() {
      var count = this.model.get('category');
      var terms = this.model.get('terms').length;

      // Set counter visibility
      this.$('.counter .counter-label')[ terms > 0 ? 'fadeIn' : 'fadeOut' ]();

      // Set counter number
      this.$('.counter-label').text(this.model.get('counter'));
    },

    show: function() {
      this.$el.addClass('enabled');
    },

    hide: function() {
      this.$el.removeClass('enabled');
    }

  });