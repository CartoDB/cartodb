cdb.decorators = {};

cdb.decorators.super = (function() {
  // we need to backup one of the backbone extend models
  // (it doesn't matter which, they are all the same method)
  var backboneExtend = Backbone.Router.extend;
  var superMethod = function(method, options) {
      var result = null;
      if (this.parent != null) {
          var currentParent = this.parent;
          // we need to change the parent of "this", because
          // since we are going to call the super method
          // in the context of "this", if the super method has
          // another call to super, we need to provide a way of
          // redirecting to the grandparent
          this.parent = this.parent.parent;
          if (currentParent.hasOwnProperty(method)) {
              result = currentParent[method].call(this, options);
          } else {
              result = currentParent.super.call(this, method, options);
          }
          this.parent = currentParent;
      }
      return result;
  }
  var extend = function(protoProps, classProps) {
      var child = backboneExtend.call(this, protoProps, classProps);

      child.prototype.parent = this.prototype;
      child.prototype.super = function(method) {
          if (method) {
              return superMethod.call(this, method);
          } else {
              return child.prototype.parent;
          }
      }
      return child;
  };
  var decorate = function(objectToDecorate) {
    objectToDecorate.extend = extend;
    objectToDecorate.prototype.super = function() {};
    objectToDecorate.prototype.parent = null;
  }
  return decorate;
})()

cdb.decorators.super(Backbone.Model);
cdb.decorators.super(Backbone.View);
cdb.decorators.super(Backbone.Collection);
