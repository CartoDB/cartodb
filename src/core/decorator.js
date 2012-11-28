/**
* Decorators to extend funcionality of cdb related objects
*/

/**
* Adds .elder method to call for the same method of the parent class
* usage:
*   insanceOfClass.elder('name_of_the_method');
*/
cdb.decorators.elder = (function() {
  // we need to backup one of the backbone extend models
  // (it doesn't matter which, they are all the same method)
  var backboneExtend = Backbone.Router.extend;
  var superMethod = function(method, options) {
      var result = null;
      if (this.parent != null) {
          var currentParent = this.parent;
          // we need to change the parent of "this", because
          // since we are going to call the elder (super) method
          // in the context of "this", if the super method has
          // another call to elder (super), we need to provide a way of
          // redirecting to the grandparent
          this.parent = this.parent.parent;
          var options = Array.prototype.slice.call(arguments, 1);

          if (currentParent.hasOwnProperty(method)) {
              result = currentParent[method].apply(this, options);
          } else {
              options.splice(0,0, method);
              result = currentParent.elder.apply(this, options);
          }
          this.parent = currentParent;
      }
      return result;
  }
  var extend = function(protoProps, classProps) {
      var child = backboneExtend.call(this, protoProps, classProps);

      child.prototype.parent = this.prototype;
      child.prototype.elder = function(method) {
          var options = Array.prototype.slice.call(arguments, 1);
          if (method) {
              options.splice(0,0, method)
              return superMethod.apply(this, options);
          } else {
              return child.prototype.parent;
          }
      }
      return child;
  };
  var decorate = function(objectToDecorate) {
    objectToDecorate.extend = extend;
    objectToDecorate.prototype.elder = function() {};
    objectToDecorate.prototype.parent = null;
  }
  return decorate;
})()

cdb.decorators.elder(Backbone.Model);
cdb.decorators.elder(Backbone.View);
cdb.decorators.elder(Backbone.Collection);

if(!window.JSON) {
  // shims for ie7
  window.JSON = {
    stringify: function(param) {
      if(typeof param == 'number' || typeof param == 'boolean') {
        return param.toString();
      } else if (typeof param =='string') {
        return '"' + param.toString() + '"';
      } else if(_.isArray(param)) {
        var res = '[';
        for(var n in param) {
          if(n>0) res+=', ';
          res += JSON.stringify(param[n]);
        }
        res += ']'
        return res;
      } else {
        var res = '{';
        for(var p in param) {
          if(param.hasOwnProperty(p)) {
            res += '"'+p+'": '+ JSON.stringify(param[p]);
          }
        }
        res += '}'
        return res;
      }
      // no, we're no gonna stringify regexp, fuckoff.
    },
    parse: function(param) {
      return eval(param);
    }
  }
}
