/**
 * slides lateral panel
 */

cdb.admin.SlidesPanel = cdb.core.View.extend({

  className: 'slides_panel',

  initialize: function() {
    this.slides = this.options.slides;
    if (!this.slides) {
      throw new Error("slides is undefined");
    }

    this.add_related_model(this.slides);
    this.slides.bind('reset', function() {
      this.slides.each(this._add.bind(this));
    }, this);
    this.slides.bind('add', this._add, this);
    this.slides.bind('remove', this._remove, this);

    // TODO: move to css
    this.$el.css({
      position: 'absolute',
      top: '100px',
      left: 0,
      width: '150px',
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.3)',
      'z-index': 1
    });

  },

  _add: function(slide) {
    var v = new cdb.admin.SlideView({ model: slide });
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _remove: function(slide) {
    var view = _.find(this._subviews, function(v) {
      return v.model.cid === slide.cid;
    });
    view.clean();
  }

});

/**
 * view for a single slide
 */
cdb.admin.SlideView = cdb.core.View.extend({

  className: 'slide_view',
  events: {
    'click': '_click'
  },

  initialize: function () {
    this.model.bind('change:active', this._changeActive, this);

    // TODO: move to css
    this.$el.css({
      width: '150px',
      height: '150px',
      background: '#444',
      'margin-bottom': '20px'
    });
  },

  _click: function() {
    this.model.collection.setActive(this.model);
  },

  _changeActive: function() {
    //TODO: do this with a class
    if (this.model.isActive()) {
      this.$el.css('background', '#222');
    } else {
      this.$el.css('background', '#444');
    }
  }

});

