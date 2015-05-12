function SubLayer(_parent, position) {
  this._parent = _parent;
  this._position = position;
  this._added = true;
  this._bindInteraction();
  if (Backbone.Model && this._parent.getLayer(this._position)) {
    this.infowindow = new Backbone.Model(this._parent.getLayer(this._position).infowindow);
    this.infowindow.bind('change', function() {
      var def = this._parent.getLayer(this._position);
      def.infowindow = this.infowindow.toJSON();
      this._parent.setLayer(this._position, def);
    }, this);
  }
}

SubLayer.prototype = {

  remove: function() {
    this._check();
    this._parent.removeLayer(this._position);
    this._unbindInteraction();
    this._added = false;
    this.trigger('remove', this);
  },

  toggle: function() {
    this.get('hidden') ? this.show() : this.hide();
    return !this.get('hidden');
  },

  show: function() {
    if(this.get('hidden')) {
      this.set({
        hidden: false
      });
    }
  },

  hide: function() {
    if(!this.get('hidden')) {
      this.set({
        hidden: true
      });
    }
  },

  set: function(new_attrs) {
    this._check();
    var def = this._parent.getLayer(this._position);
    var attrs = def.options;
    for(var i in new_attrs) {
      attrs[i] = new_attrs[i];
    }
    this._parent.setLayer(this._position, def);
    if (new_attrs.hidden !== undefined) {
      this.trigger('change:visibility', this, new_attrs.hidden);
    }
    return this;
  },

  unset: function(attr) {
    var def = this._parent.getLayer(this._position);
    delete def.options[attr];
    this._parent.setLayer(this._position, def);
  },

  setSQL: function(sql) {
    return this.set({
      sql: sql
    });
  },

  setCartoCSS: function(cartocss) {
    return this.set({
      cartocss: cartocss
    });
  },

  setInteractivity: function(fields) {
    return this.set({
      interactivity: fields
    });
  },

  setInteraction: function(active) {
    this._parent.setInteraction(this._position, active);
  },

  get: function(attr) {
    this._check();
    var attrs = this._parent.getLayer(this._position);
    return attrs.options[attr];
  },

  getSQL: function() {
    return this.get('sql');
  },

  getCartoCSS: function() {
    return this.get('cartocss');
  },

  _check: function() {
    if(!this._added) throw "sublayer was removed";
  },

  _unbindInteraction: function() {
    if(!this._parent.off) return;
    this._parent.off(null, null, this);
  },

  _bindInteraction: function() {
    if(!this._parent.on) return;
    var self = this;
    // binds a signal to a layer event and trigger on this sublayer
    // in case the position matches
    var _bindSignal = function(signal, signalAlias) {
      signalAlias = signalAlias || signal;
      self._parent.on(signal, function() {
        var args = Array.prototype.slice.call(arguments);
        if (parseInt(args[args.length - 1], 10) ==  self._position) {
          self.trigger.apply(self, [signalAlias].concat(args));
        }
      }, self);
    };
    _bindSignal('featureOver');
    _bindSignal('featureOut');
    _bindSignal('featureClick');
    _bindSignal('layermouseover', 'mouseover');
    _bindSignal('layermouseout', 'mouseout');
  },

  _setPosition: function(p) {
    this._position = p;
  }
};

// give events capabilitues
_.extend(SubLayer.prototype, Backbone.Events);
