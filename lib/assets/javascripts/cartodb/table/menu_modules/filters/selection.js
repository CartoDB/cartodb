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
      'click a.remove':           '_remove',
      'click a.up':               '_move',
      'click a.down':             '_move',
      'click a.all':              '_select',
      'click a.none':             '_select',
      'click .view_mode label':   '_toggleSwitch'
    },

    initialize: function() {

      _.bindAll(this, "_updateCounter");

      this.model.items.bind('reset', this.render, this);
      this.model.bind("change:scrollers", this._toggleScrollers, this);
      this.model.bind("change:all",  this._toggleButton, this);
      this.model.bind("change:none", this._toggleButton, this);

      this.add_related_model(this.model.items);
    },

    _toggleButton: function(value) {
      console.log("value", value);
    },

    _updateCounter: function() {

      var count = _.countBy(this.model.items.models, function(m) { return m.get("selected") ? "selected" : "unselected"; });

      if (count.selected == _.size(this.model.items)) {
        this.model.set({ all: true });
        this.$all.addClass("selected");
        this.$none.removeClass("selected");
      }
      else if (!count.selected) {
        this.$none.addClass("selected");
        this.$all.removeClass("selected");
      }
      else {
        this.$none.removeClass("selected");
        this.$all.removeClass("selected");
      }

      var c = count.selected == undefined ? 0 : count.selected;
      this.$el.find(".count").html(" - " + c + " selected");

    },

    _toggleScrollers: function() {

      if (this.model.get("scrollers")) this.$el.find(".scrollers").show();
      else this.$el.find(".scrollers").hide();

    },

    _addItems: function() {

      var self = this;

      this.model.items.each(function(m) {

        var v = new SelectorView({ model: m });

        v.bind("updateCounter", self._updateCounter, self);
        self.$items.append(v.render().el);
        self.addView(v);

      });

    },

    _addSwitch: function() {

      var self = this;

      this.switch = new cdb.forms.Switch({
        el: self.$el.find(".switch"),
        model: self.model,
        property: "mode"
      });

      this.switch.model.bind("change:mode", this._toggleMode, this);

    },

    render: function() {

      var self = this;

      this.clearSubViews();

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/selection')({
        legend: this.model.escape('column'),
        count: 0
      }));

      this.$scroll = this.$el.find('.scroll');
      this.$items  = this.$el.find('.items');
      this.$all    = this.$el.find('.all');
      this.$none   = this.$el.find('.none');

      this._addItems();
      this._updateCounter();

      if (this.$items.height() > 200) {
        this.model.set("scrollers", true);
        this.$el.find(".white-gradient-shadow.bottom").css({ opacity: 1 });
      }

      this._addSwitch();

      return this;

    },

    _toggleSwitch: function() {
      this.switch.model.set("mode", !this.switch.model.get("mode"));
    },

    _toggleMode: function() {
      //console.log(this.switch.model.get("mode"));
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


      this.$all.addClass("selected");
      this.$none.removeClass("selected");

      this.model.items.each(function(i) {
        i.set("selected", true);
      });

    },

    _selectNone: function(e) {

      this.$none.addClass("selected");
      this.$all.removeClass("selected");

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
      this.$el.find(".scrollers .down").removeClass("disabled");

      this.$scroll.stop().animate({ scrollTop: "-=120px" }, 150, function() {

        if (self.$items.position().top == 0) {
          self.$el.find(".scrollers .up").addClass("disabled");
          self._toggleShadow("top", 0);
        }

      });
    },

    _moveDown: function(e) {
      var self = this;

      this._toggleShadow("top", 1);
      this.$el.find(".scrollers .up").removeClass("disabled");

      this.$el.find(".scroll").stop().animate({ scrollTop: "+=120px" }, 150, function() {

        if (self.$scroll.scrollTop() > self.$items.height() - 200 ) {
          self._toggleShadow("bottom", 0);
          self.$el.find(".scrollers .down").addClass("disabled");
        }

      });

    },

    _remove: function() {
      this.model.destroy();
    }

  });



})();
