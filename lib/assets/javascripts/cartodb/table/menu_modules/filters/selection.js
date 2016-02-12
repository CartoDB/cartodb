(function() {

  // Selection Filter

  var SelectorView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click': 'toggle'
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.template_base = _.template("<p class='<% if (bucket == undefined || bucket == '' || bucket == 'null') { %>empty<% } %>'><% if (bucket == undefined) { %>null<% } else if (bucket == '') {%>empty<% } else { %><%- bucket %><% } %></p> <div class='value'><%- value %></div>");
    },

    /*
     * Adds thousands separators.
     **/
    _formatNumber:function(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    },

    _cleanString: function(s) {

      var n = 180; // truncate length

      if (s) {
        s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
        s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
      }

      return s;

    },

    render: function() {

      var pretty_bucket;
      var bucket_name = this.model.get("bucket");

      if (this.options.column_type == 'boolean') {

        if (bucket_name == null) pretty_bucket = "null";
        else pretty_bucket = (bucket_name) ? "true" : "false";

      } else {
        pretty_bucket = this._cleanString(bucket_name);
      }

      // Format the number
      var value = this.model.get("value");
      this.model.set("value", this._formatNumber(value));

      this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options, { bucket: pretty_bucket } )));

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

  // Categorical Filter

  var OperationView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a.remove-inline': '_remove',
      'change select.operation': '_onOperationChanged',
      'change select.operator': '_onOperatorChanged',
      'change input[type="text"]': '_onTextChanged'
    },

    OPERATORS: {
      'OR': 'Or',
      'AND': 'And',
    },
    OPERATIONS: {
      'BEGINSWITH': 'Begins with',
      'CONTAINS': 'Contains',
      'ENDSWITH': 'Ends with',
      'EQUALS': 'Equals'
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.template = this.getTemplate('table/menu_modules/filters/templates/operation');
    },

    _cleanString: function(s) {

      var n = 180; // truncate length

      if (s) {
        s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
        s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
      }

      return s;

    },

    _onTextChanged: function (event) {
      var value = $(event.target).val();
      this.model.set('text', value);
    },

    _onOperatorChanged: function (event) {
      var value = $(event.target).val();
      this.model.set('operator', value);
    },

    _onOperationChanged: function (event) {
      var value = $(event.target).val();
      this.model.set('operation', value);
    },

    render: function() {

      this.$el.html(this.template(_.extend(this.model.toJSON(), {
        first: this.model.collection.indexOf(this.model) === 0,
        operators: this.OPERATORS,
        operations: this.OPERATIONS
      } )));

      return this;
    },

    _remove: function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.model.destroy();
    }

  });

  cdb.admin.mod.SelectorFilter = cdb.core.View.extend({

    tagName: 'li',
    className: 'filter selection',

    _SCROLLSTEP: 120,

    events: {
      'keypress input[name="query"]': '_onKeyPress',
      'click a.apply':            '_onApply',
      'click a.remove':           '_remove',
      'click a.up':               '_move',
      'click a.down':             '_move',
      'click a.all':              '_select',
      'click a.none':             '_select',
      'click .view_mode label':   '_toggleSwitch'
    },

    initialize: function() {

      _.bindAll(this, "_updateCounter");

      this.model.items.bind('reset',        this.render, this);
      this.model.operations.bind('add',     this._renderOperations, this);
      this.model.operations.bind('remove',  this._renderOperations, this);
      this.model.operations.bind('reset',  this._renderOperations, this);

      this.model.bind("change:controllers", this._toggleControllers, this);

      this.model.bind("change:scrollers",   this._toggleScrollers,   this);

      this.model.bind("change:list_view",   this._toggleMode,        this);
      this.model.bind("change:legend",      this._updateLegend,      this);

      this.model.bind("change:show_items",   this._toggleItems,   this);

      this.add_related_model(this.model.items);
      this.add_related_model(this.model.operations);

    },

    _cleanString: function(s) {

      if (s) {
        s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
      }

      return s;

    },

    _updateLegend: function() {
      this.$(".legend").html(this.model.get("legend"));
    },

    _updateCounter: function() {

      var count = _.countBy(this.model.items.models, function(m) { return m.get("selected") ? "selected" : "unselected"; });

      this.model.set("count", count);

      if (count.selected == _.size(this.model.items)) {
        this.model.set({ all: true });
        this.$all.addClass("selected");
        this.$none.removeClass("selected");
      }
      else if (!count.selected) {
        this.$none.addClass("selected");
        this.$all.removeClass("selected");
      } else {
        this.$none.addClass("selected");
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

    _showScrollers: function() {
      this.model.set("scrollers", true)
      this.$el.find(".fields").addClass("has_scrollers");
    },

    _hideScrollers: function() {
      this.model.set("scrollers", false)
      this.$el.find(".fields").removeClass("has_scrollers");
    },

    _hideItems: function() {
      this.model.set("show_items", false)
    },

    _toggleItems: function() {

      if (this.model.get("show_items")) this.$el.find(".items").fadeIn(250);
      else this.$el.find(".items").fadeOut(250);

    },

    _toggleScrollers: function() {

      if (this.model.get("scrollers")) {
        this.$el.find(".scrollers").removeClass("hidden");
      } else {
        this.$el.find(".scrollers").addClass("hidden");
      }

    },

    _addItems: function() {

      var self = this;

      this.model.items.each(function(m) {

        var v = new SelectorView({ model: m, column_type: self.model.get("column_type") });

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

    },

    _onKeyPress: function(e) {

      if (e.keyCode == 13) { this._onApply(e); }

    },

    _onApply: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $input = this.$input.find("input");
      var t = $input.attr("value");

      var m = new cdb.admin.models.CategoricalOperation({
        operator: 'OR',
        operation: 'BEGINSWITH',
        text: t
      }, { collection: this.model.operations });
      this.model.operations.add(m);

      // Reset input to blank
      $input.val("");
    },

    render: function() {

      var self = this;

      this.clearSubViews();

      var status = "loading";
      var count = this.model.get("count");

      if (count) {

        if (this.model.items.length == 0 || (this.model.items.length == 1 && this.model.items.at(0).get("bucket") == null)) {
          status = "empty";
        } else if (this.model.items.length == 1) {
          status = "only";
        } else {
          status = "loaded";
        }

      }

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/selection')({
        status: status,
        column_type: this.model.get("column_type"),
        legend: this.model.escape('column'),
        short_legend: this.model.escape('column'),
        list_view: this.model.get("list_view"),
        reached_limit: this.model.get('reached_limit')
      }));

      this.$scroll    = this.$el.find('.scroll');
      this.$items     = this.$el.find('.items');
      this.$all       = this.$el.find('.all');
      this.$none      = this.$el.find('.none');
      this.$input     = this.$el.find('.input_field');

      this._addItems();
      this._updateCounter();

      if (this.$items.find("li").length > 5) {
        this.model.set("scrollers", true);
        this.$el.find(".white-gradient-shadow.bottom").css({ opacity: 1 });
      }

      if (this.model.get("reached_limit")) {

        this.model.set({ list_view: false });
        this._toggleMode();
        this.model.set("legend", this.model.escape('column'));

        // Adds the tipsy
        this.$el.find(".view_mode").tipsy({ gravity: 's', fade:true, html: true, live:true });

      } else {


        if (this.model.get("column_type") == "boolean") this.$el.find(".options").hide();

        if (status != "loaded") this._hideItems();
        else {
          this._addSwitch();
          this._toggleMode();
        }

      }

      this._renderOperations();

      return this;

    },

    _renderOperations: function () {
      var self = this;
      this.$operations = this.$el.find('.operations');
      this.$operations.empty();

      this.model.operations.each(function (m) {
        var v = new OperationView({ model: m, column_type: self.model.get("column_type") });
        self.$operations.append(v.render().el);
        self.addView(v);
      });
    },

    _toggleSwitch: function() {

      if (!this.model.get("reached_limit")) {
        this.model.set("list_view", !this.model.get("list_view"));
      }

    },

    // Toggle between list and free text views
    _toggleMode: function() {

      if (this.model.get("list_view")) this._showListView();
      else this._showFreeTextView();

    },

    _showFreeTextView: function() {

      this._toggleShadow("top", 0);
      this._toggleShadow("bottom", 0);

      this.$el.find(".scroll").animate({ height: 55 }, { duration: 250 });

      this.$input.fadeIn(250);
      this.$el.find(".operations").fadeIn(250);

      this.$el.find(".scroll .items").fadeOut(150);

      this._hideControllers();
      this._hideScrollers();

      this.$el.find(".fields").removeClass("list");
      this.$el.find(".fields").addClass("text");

      this.model.set("legend", this.model.escape('column'));

      this.trigger("refresh_scroll");

    },

    _showListView: function() {

      var count = this.model.get("count");

      this.$input.fadeOut(250);
      this.$el.find(".operations").fadeOut(250);

      this.$el.find(".scroll .items").fadeIn(150);
      var h = (this.$el.find(".scroll .items li").length + 1) * 34;

      this.$el.find(".scroll").animate({ height: h }, { duration: 150 });

      this._showControllers();

      var c = 0;

      if (count.selected)   c = count.selected;
      if (count.unselected) c += count.unselected;

      if (c >= 5) {
        this._showScrollers();
        this._toggleShadow("top", 0);
        this._toggleShadow("bottom", 1);
      } else {
        this._hideScrollers();
      }

      this.$el.find(".fields").removeClass("text");
      this.$el.find(".fields").addClass("list");

      this.model.set("legend", this.model.escape('column') + ":");

      this.trigger("refresh_scroll");


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

    // Turns shadows on/off
    _toggleShadow: function(pos, opacity) {
      this.$el.find(".white-gradient-shadow." + pos).animate({ opacity: opacity }, 50);
    },

    _moveUp: function(e) {
      var self = this;

      this._toggleShadow("bottom", 1);
      this.$el.find(".scrollers .down").removeClass("disabled");

      this.$scroll.stop().animate({ scrollTop: "-=" + this._SCROLLSTEP + "px" }, 150, function() {

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

      this.$el.find(".scroll").stop().animate({ scrollTop: "+=" + this._SCROLLSTEP + "px" }, 150, function() {

        var scrollTopPos = self.$scroll.scrollTop();
        var listHeight   = self.$scroll.find("ul").height();
        var liHeight     = self.$scroll.find("li:last-child").outerHeight(true);

        if (scrollTopPos + self._SCROLLSTEP + liHeight >= listHeight) {
          self._toggleShadow("bottom", 0);
          self.$el.find(".scrollers .down").addClass("disabled");
        }

      });

    },

    _remove: function(e) {

      e.preventDefault();
      e.stopPropagation();

      this.model.destroy();
    }

  });

})();
