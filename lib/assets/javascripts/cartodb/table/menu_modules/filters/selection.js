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
      'click a.down':   '_move',
      'click a.all':    '_select',
      'click a.none':   '_select'
    },

    initialize: function() {

      _.bindAll(this, "_updateCounter");

      this.model.items.bind('reset',  this.render, this);
      this.model.bind("change:scrollers", this._toggleScrollers, this);

      this.add_related_model(this.model.items);
    },

    _updateCounter: function() {

      var count = _.countBy(this.model.items.models, function(m) { return m.get("selected") ? "selected" : "unselected"; });
      var c = count.selected == undefined ? 0 : count.selected;
      this.$el.find(".count").html(" - " + c + " selected");

    },

    _toggleScrollers: function() {

      if (this.model.get("scrollers")) this.$el.find(".scrollers").show();
      else this.$el.find(".scrollers").hide();

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

      if (this.$el.find(".items").height() > 200) {
        this.model.set("scrollers", true);
        this.$el.find(".white-gradient-shadow.bottom").css({ opacity: 1 });
      }

      this.switch = new cdb.forms.Switch({
        el: ".switch",
        model: self.model,
        property: "mode"
      });

      this.switch.model.bind("change:mode", this._toggleMode, this);

      return this;

    },

    _toggleMode: function() {
      console.log(this.switch.model.get("mode"));
    },

    // Allows the selection of all or none of items
    _select: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $btn = $(e.target);

      if ($btn.hasClass("all")) this._selectAll(e);
      else this._selectNone(e);

    },

    _selectAll: function(e) {

      this.model.items.each(function(i) {
        i.set("selected", true);
      });

    },

    _selectNone: function(e) {

      this.model.items.each(function(i) {
        i.set("selected", false);
      });

    },

    _move: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $btn = $(e.target);
      if ($btn.hasClass("up")) this._moveUp(e);
      else this._moveDown(e);

    },

    _toggleShadow: function(pos, opacity) {
      this.$el.find(".white-gradient-shadow." + pos).animate({ opacity: opacity }, 50);
    },

    _moveUp: function(e) {
      var self = this;

      this._toggleShadow("bottom", 1);

      this.$el.find(".scroll").stop().animate({ scrollTop: "-=120px" }, 150, function() {

        if (self.$el.find('.items').position().top == 0) {
          self._toggleShadow("top", 0);
        }

      });
    },

    _moveDown: function(e) {
      var self = this;

      this._toggleShadow("top", 1);

      this.$el.find(".scroll").stop().animate({ scrollTop: "+=120px" }, 150, function() {

        if (self.$el.find('.scroll').height() + 30 >  -1*self.$el.find('.items').position().top) {
          self._toggleShadow("bottom", 0);
        }

      });

    },

    _remove: function() {
      this.model.destroy();
    }

  });



})();
