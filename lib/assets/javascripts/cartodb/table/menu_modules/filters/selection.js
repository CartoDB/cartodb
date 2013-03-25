(function() {

  // Selection Filter

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
      'keyup textarea':           '_onKeyUp',
      'change textarea':          '_onKeyUp',
      'click a.remove':           '_remove',
      'click a.up':               '_move',
      'click a.down':             '_move',
      'click a.all':              '_select',
      'click a.none':             '_select',
      'click .view_mode label':   '_toggleSwitch'
    },

    initialize: function() {

      _.bindAll(this, "_updateCounter");

      this.model.items.bind('reset',      this.render, this);

      this.model.bind("change:controllers", this._toggleControllers, this);
      this.model.bind("change:scrollers",   this._toggleScrollers,   this);
      this.model.bind("change:counter",     this._toggleCounter,     this);
      this.model.bind("change:all",         this._toggleButton,      this);
      this.model.bind("change:none",        this._toggleButton,      this);
      this.model.bind("change:list_view",   this._toggleMode,        this);

      this.add_related_model(this.model.items);

    },

    _toggleButton: function(value) {
      //console.log("value", value);
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

    _showControllers: function() {
      this.model.set("controllers", true)
    },

    _hideControllers: function() {
      this.model.set("controllers", false)
    },

    _toggleControllers: function() {

      if (this.model.get("controllers")) this.$el.find(".controllers").fadeIn(250);
      else this.$el.find(".controllers").fadeOut(250);

    },

    _showCounter: function() {
      this.model.set("counter", true)
    },

    _hideCounter: function() {
      this.model.set("counter", false)
    },

    _toggleCounter: function() {

      if (this.model.get("counter")) this.$el.find(".count").fadeIn(250);
      else this.$el.find(".count").fadeOut(250);

    },

    _showScrollers: function() {
      this.model.set("scrollers", true)
    },

    _hideScrollers: function() {
      this.model.set("scrollers", false)
    },

    _toggleScrollers: function() {

      if (this.model.get("scrollers")) this.$el.find(".scrollers").fadeIn(250);
      else this.$el.find(".scrollers").fadeOut(250);

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
        property: "list_view"
      });

      this.switch.unbind("change:list_view", this._toggleSwitchMode);
      this.switch.bind("change:list_view", this._toggleSwitchMode, this);

    },

    _toggleSwitchMode: function() {
      this.model.set("list_view", this.switch.model.get("list_view"));
    },

    _onKeyUp: function(e) {
      var self = this;

      clearTimeout(this.keyTime);

      this.keyTime = setTimeout(function() {
        var t = self.$textarea.find("textarea").val()
        self.model.set("free_text", t);
      }, 250);

    },

    render: function() {

      var self = this;

      this.clearSubViews();

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/selection')({
        legend: this.model.escape('column'),
        count: 0,
        reached_limit: this.model.get('reached_limit')
      }));

      this.$scroll    = this.$el.find('.scroll');
      this.$items     = this.$el.find('.items');
      this.$all       = this.$el.find('.all');
      this.$none      = this.$el.find('.none');
      this.$textarea  = this.$el.find('.textarea');

      this._addItems();
      this._updateCounter();

      if (this.$items.height() > 200) {
        this.model.set("scrollers", true);
        this.$el.find(".white-gradient-shadow.bottom").css({ opacity: 1 });
      }

      if (!this.model.get("reached_limit")) {
        this._addSwitch();
      } else {
        this.model.set({ list_view: false }, { silent: true });
        this._toggleMode();
        this.$el.find(".view_mode").tipsy({ gravity: 's', fade:true, html: true, live:true });
      }

      return this;

    },

    _toggleSwitch: function() {
      if (!this.model.get("reached_limit")) {
        this.model.set("list_view", !this.model.get("list_view"));
      }
    },

    _toggleMode: function() {

      var self = this;

      var list_view = this.model.get("list_view");

      if (!list_view) {
        this._toggleShadow("top", 0);
        this._toggleShadow("bottom", 0);

        this.$el.find(".scroll").animate({ height: 55 }, { duration: 250, complete: function() { }});
        this.$textarea.fadeIn(250);
        this.$el.find(".scroll .items").fadeOut(150, function() { });

        this._hideControllers();
        this._hideScrollers();
        this._hideCounter();

        this.trigger("refresh_scroll");

      } else {

        this.$textarea.fadeOut(250, function() { });
        this.$el.find(".scroll").animate({ height: 167 }, { duration: 150, complete: function() { }});
        this.$el.find(".scroll .items").fadeIn(150);

        this._toggleShadow("top", 0);
        this._toggleShadow("bottom", 1);
        this._showControllers();
        this._showScrollers();
        this._showCounter();

        this.trigger("refresh_scroll");

      }

    },

    // Allows the selection of all or none of items
    _select: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $btn = $(e.target);

      if ($btn.hasClass("all")) this._selectAll(e);
      else this._selectNone(e);

      this._updateCounter();

    },

    _selectAll: function(e) {

      this.$all.addClass("selected");
      this.$none.removeClass("selected");

      this.model.items.each(function(i) {
        i.set({ selected: true });
      });

    },

    _selectNone: function(e) {

      this.$none.addClass("selected");
      this.$all.removeClass("selected");

      this.model.items.each(function(i) {
        i.set({ selected: false });
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
