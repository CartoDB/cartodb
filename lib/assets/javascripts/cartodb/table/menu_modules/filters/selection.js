(function() {

  var SelectorView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click': 'toggle'
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.template_base = _.template("<%= bucket %>  <div class='value'><%= value %></div>");
    },

    render: function() {

      this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options)));

      if(this.model.get('selected')) {
        this.$el.addClass('selected');
      } else {
        this.$el.removeClass('selected');
      }

      return this;

    },

    toggle: function() {

      var m = this.model.get('selected');
      this.model.set('selected', !m);
      this.trigger("updateCounter");

    }

  });

  cdb.admin.mod.SelectorFilter = cdb.core.View.extend({

    tagName: 'li',
    className: 'filter selection',

    events: {
      'click a.remove': '_remove',
      'click a.up':     '_move',
      'click a.down':   '_move'
    },

    initialize: function() {

      _.bindAll(this, "_updateCounter");

      this.model.items.bind('reset',  this.render, this);
      this.add_related_model(this.model.items);
    },

    _updateCounter: function() {

      var count = _.countBy(this.model.items.models, function(m) { return m.get("selected") ? "selected" : "unselected"; });
      var c = count.selected == undefined ? 0 : count.selected;
      this.$el.find(".count").html(" - " + c + " selected");

    },

    render: function() {

      var self = this;

      this.clearSubViews();

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/selection')({
        legend: this.model.escape('column'),
        count: 0
      }));

      var items = this.$('ul.items');

      this.model.items.each(function(m) {

        var v = new SelectorView({
          model: m
        });

        v.bind("updateCounter", self._updateCounter, self);

        items.append(v.render().el);

        self.addView(v);

      });

      self._updateCounter();

      //$('.scroll').jScrollPane({ showArrows: true });

      return this;

    },

    _move: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var $btn = $(e.target);
      if ($btn.hasClass("up")) this._moveUp(e);
      else this._moveDown(e);

    },

    _moveUp: function(e) {
      var self = this;

      self.$el.find(".white-gradient-shadow.bottom").animate({ opacity: 1 }, 50);

      this.$el.find(".scroll").stop().animate({ scrollTop: "-=120px" }, 150, function() {

        if (self.$el.find('.items').position().top == 0) {
          self.$el.find(".white-gradient-shadow.top").animate({ opacity: 0 }, 50);
        }

      });


    },

    _moveDown: function(e) {
      var self = this;

      self.$el.find(".white-gradient-shadow.top").animate({ opacity: 1 }, 50);

      this.$el.find(".scroll").stop().animate({ scrollTop: "+=120px" }, 150, function() {

        if (self.$el.find('.scroll').height() + 30 >  -1*self.$el.find('.items').position().top) {
          self.$el.find(".white-gradient-shadow.bottom").animate({ opacity: 0 }, 50);
        }

      });

    },

    _remove: function() {
      this.model.destroy();
    }

  });



})();
