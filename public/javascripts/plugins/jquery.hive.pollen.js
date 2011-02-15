/**   
*   jQuery.Hive.Pollen/PollenJS/Pollen.JS 2009 Rick Waldron
*   http://github.com/rwldrn
*   http://pollenjs.com
*   MIT License
*   version: 0.1.91
*   (see source for other credits)
*/
//  ES5 forEach implementation
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function (fn) {
    var len = this.length || 0, i = 0, thisp = arguments[1];
    if (typeof fn !== 'function')  {
      throw new TypeError();
    }

    for ( ; i < len; i++) {
      if (i in this) {
        fn.call(thisp, this[i], i, this);
      }
    }
  };
}


;(function (worker) {
  
  var Pollen  = function() {
    this[0] = worker;
    return this;
  },
  
  //  Aliases
  each    = Array.prototype.forEach,
  indexOf = Array.prototype.indexOf,
  push    = Array.prototype.push,
  slice   = Array.prototype.slice,
  hasOwn  = Object.prototype.hasOwnProperty,
  toStr   = Object.prototype.toString,
  trim    = String.prototype.trim;

  Pollen.prototype = {
    
    identity: 0,
    
    identify: {
      identify: function () {
        return Pollen.identity;
      }
    },
    date: {
      /** 
       *  $.now([uts]) -> Microseconds or UTS
       **/    
      now:  function ( uts ) {
        return uts ?
                Math.round(new Date().getTime()/1000) :
                +new Date();
      }
    },    
    /**
      Function
    */
    func: {
      /** 
       *  $.noop() -> Empty function, Lifted from jQuery 1.4+, returns empty function (replaced $.emptyFn())
       **/
      noop:     function  () { },      
      /** 
       *  $.bind( function, context, args ) -> Function with explicit context, context sets 'this'
       **/
      bind:     function  ( fn, cntxt, args ) {
        if ( fn === null ) {
          return cntxt;
        }
      
        if ( cntxt ) {
          if ( typeof fn === 'string' ) {
            fn = cntxt[ fn ];
          }
          if ( fn ) {
            return function() {
              return fn.apply( cntxt, args );
            };
          }
        }
      }
    }, 
    /**
      Eval
    */  
    evaluate:     {
      /** 
       *  $.isObj( arg ) -> Boolean, object was created with {} or new Object()
       **/    
      isObj: function( arg ) {
        //  Adapted From jQuery.isPlainObject() -- Replaces Pollen.isObjLiteral()
        
        if ( !arg ) {
          return false;
        }

        // Not own constructor property must be Object
        if ( arg.constructor &&
              !hasOwn.call(arg, 'constructor')  && 
                !hasOwn.call(arg.constructor.prototype, 'isPrototypeOf') ) {
          return false;
        }

        var key;
        for ( key in arg ) {}

        return key === undefined || hasOwn.call( arg, key );
      },
      /** 
       *  $.isArr( arg ) -> Boolean, Array
       **/    
      isArr:        function ( arg ) {
        return arg !== null && typeof arg == 'object' &&
                  'splice' in arg && 'join' in arg;
      },
      /** 
       *  $.isRegExp( arg ) -> Boolean, Regular Expression
       **/    
      isRegExp:       function ( arg )  {
        if ( arg )  {
          
          if ( new RegExp(/([[\]\/\\])/g).test(arg) === false ) {
            return false;
          }
        
          return (new RegExp(arg)).test(null) || toStr.call(arg) == '[object RegExp]';
        }
        
        return false;
      },  
      /** 
       *  $.isFn( arg ) -> Boolean, Function
       **/    
      isFn:         function ( arg ) {
        return arg !== null && toStr.call(arg) === '[object Function]' && typeof arg == 'function';
      },
      /** 
       *  $.isStr( arg ) -> Boolean, String
       **/      
      isStr:        function ( arg ) {
        return arg !== null && typeof arg == 'string' && isNaN(arg);
      },
      /** 
       *  $.isNum( arg ) -> Boolean, Number
       **/      
      isNum:        function ( arg ) {
        return arg !== null && typeof arg == 'number';
      },
      /** 
       *  $.isJson( arg ) -> Boolean, Valid JSON String
       **/      
      isJson:       function ( arg ) {
        if ( arg === null ) return false;
        
        var _test = Pollen.evaluate.isObj(arg) ? JSON.stringify(arg) : arg;
      
        return ( new RegExp('^("(\\\\.|[^"\\\\\\n\\r])*?"|[,:{}\\[\\]0-9.\\-+Eaeflnr-u \\n\\r\\t])+?$') ).test(_test);        
      },
      /** 
       *  $.isDef( arg ) -> Boolean, Defined
       **/        
      isDef:        function ( arg ) {
        
        if ( !arg || arg === null || typeof arg === 'undefined' || Pollen.evaluate.isEmpty(arg) ) {
          return false;
        }

        return true;
      },  
      /** 
       *  $.isNull( arg ) -> Boolean, Null
       **/        
      isNull:       function ( arg ) {
        return arg === null;
      },
      /**
       *  $.isEmpty( arg ) -> Boolean, ''
       **/
      isEmpty:      function ( arg ) {
        return arg == null || arg == '';      
      }, 
      /**
       *  $.eq( arg, array ) -> Arg is equal to at least one definition in array
       **/      
      eq: function( arg, values ) {
        
        var i = 0, len = values.length, _eq = false;
        
        for ( ; i < len ; i++ ) {
          if ( arg === values[i] ) {
            _eq  = true;
            break;
          }
        }
        
        return _eq;
      }
    },
    /**
      String
    */  
    string: {
      /** 
       *  $.trim( arg ) -> Removes all L and R whitespace
       **/        
      trim: function ( arg ) {
        
        if ( typeof arg === 'undefined' || arg == null ) return '';
        
        arg = arg+'';
      
        return arg == '' ? '' : arg.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      },
      /** 
       *  $.inStr( arg ) -> Boolean, arg in string
       **/        
      inStr:     function( str, arg ) {
        
        //  TODO: this is crappy, can it be done better?
        if ( !str ) {
          return false;
        } 
        if ( str.indexOf(arg) >= 0 ) {
          return true;
        }
        if ( ( new RegExp(arg, "ig") ).test(str) ) {
          return true;
        }

        return false;
      },
      //  private.
      _regExpEscape:  function (str) {
        
        if ( new RegExp(/([[\]\/\\])/g).test(str) === false ) {
          return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
        }
        return str;
      }
    },
    /**
      Array
    */
    array: {
      /** 
       *  $.each( object, function ) -> Enumerate [object] (object,array), apply [function]
       **/      
      each:           function( arg, fn ) {
        
        //  THIS WHOLE METHOD NEEDS TO BE UPDATE TO USE forEach()
        var i = 0, len = arg.length;
        
        if ( Pollen.evaluate.isArr(arg) ) {
          for ( ; i < len; i++) {
            fn.call(arg, i, arg[i]); 
          }
        }

        if ( Pollen.evaluate.isObj(arg) ) {
          for ( var prop in arg ) {
            if ( arg[prop] ) {
              fn.call(arg[prop], prop, arg[prop], i++);
            }            
          }
        }
      },
      /** 
       *  $.toArray( arg ) -> Convert [arg] into an array
       **/        
      toArray:     function(arg) {
        

        if ( !arg )         { return []; }
        if ( Pollen.evaluate.isArr(arg) ) { return arg; }
        if ( Pollen.evaluate.isStr(arg) ) { return arg.split(''); }

        var len = arg.length || 0, ret = [];
        
        while (len--) {
          ret[len] = arg[len];
        }
        
        return ret;  
      },
      /** 
       *  $.isAtIndex( array, index, needle ) -> Boolean, Checks if [needle] is located at [index] in [array]
       **/        
      isAtIndex:  function( arr, i, arg ) {
        if ( arr[i] == arg ) {
          return true;
        }        
        return false;
      }, 
      /** 
       *  $.getIndex( array, needle ) -> Int, index of [needle] in [array]
       *  DEPRECATED
       **/         
      getIndex:     function(arr, arg) {
        var _index  = arr.indexOf(arg);
        return ( _index != -1 ? 
                      _index  :
                      false );
      },
      /** 
       *  $.inArray( array, needle ) -> Boolean, true if [needle] in [array]
       **/               
      inArray:        function(arr, arg) {
        var key;

        for (key in arr) {
          if (arr[key] == arg) {
            return true;
          }
        }

        return false;      
      },
      /** 
       *  $.clone( arg ) -> Array || Object, clone of [array] or Object, deep clone of [object]
       **/           
      clone:        function(arg) {
        if ( Pollen.evaluate.isArr(arg) ) {
          return [].concat(arg);
        }

        var clone = Pollen.evaluate.isArr(arg) ? [] : {};

        for (var i in obj) {
          if ( hasOwn.call(obj, i ) ) {
            clone[i] = this.clone(obj[i]);
          }
        }
        return clone;
      },
      /** 
       *  $.last( array ) -> Array Item, last item in [array]
       **/           
      last:         function(arr) {
        return arr[arr.length - 1];
      },
      /** 
       *  $.first( array ) -> Array Item, first item in [array]
       **/           
      first:         function(arr) {
        return arr[0];
      },      
      /** 
       *  $.unique( arg ) -> Array || Object, removes duplicate values from [arg](array||object), returns uniques
       **/           
      unique:       function(arg) {
        var i = 0, ret  = [], cache = [];
        
        for ( var val in arg ) {
          if ( !Pollen.array.inArray(cache, JSON.stringify(arg[val])) ) {
            ret[ ret.length ]     = arg[val];
            //  stringify the array element
            //  this will allow faster/easier comparison
            cache[ cache.length ] = JSON.stringify(arg[val]);
          }          
        }
        return ret;
      },
      /** 
       *  $.merge( arr, * ) -> Array, Merges [*](array), removes duplicate values
       **/       
      merge:        function( arr ) {
      
        var merged = arr, i = 0;
        
        // why? var i = 1
        for ( ; i < arguments.length; i++) {
          

            merged = Pollen.evaluate.isArr(arguments[i]) ? 
                        merged.concat(arguments[i]) : 
                        Pollen.object.extend(merged, arguments[i]);
        }
        return Pollen.evaluate.isArr(merged) ? this.unique(merged) : merged;

      },
      /** 
       *  $.combine( keys, values ) -> Object, An object, where [keys](array) = [values](array)
       **/       
      combine: function ( arrkeys, arrvals) {

        var i = 0, len = arrkeys.length, ret = {};

        if ( !arrkeys || !arrvals || !Pollen.evaluate.isArr(arrkeys) || !Pollen.evaluate.isArr(arrvals) ) {
          return false;
        }

        if (  len != arrvals.length){
          throw "Cannot combine arrays, key length does not match value length";
        }

        for ( ; i < len; i++ ){
          ret[ arrkeys[i] ] = arrvals[i];
        }

        return ret;
      },
      /** 
       *  $.filter( arg , function, iteration ) -> (Array||Object), apply [function](true||false) to each item in [arg], return (array||object) of true
       **/       
      filter:       function( arg, fn, iter ) {
        var i = 0, len = arg.length, ret  = [];
        
        if ( !Pollen.evaluate.isArr(arg) ) {
          
          ret  = {};
          
          for( var prop in arg ) {
            if ( fn(arg[prop], i) ) {
              ret[prop] = arg[prop];
            }
          }
          
          return ret;
        }
        
        for ( ; i < len; i++ ) {
          if ( fn(arg[i], i) ) {
            ret[ ret.length ] = arg[i];
          }
        }
        
        return ret;
      },
      /** 
       *  $.map( array, function ) -> Array, apply [function] to each item in [array], return array of new values
       **/        
      map:          function( arr, fn ) {
        var ret  = [], 
            i   = 0, len = arr.length;

        for ( ; i < len; i++ ) {
          var _new = fn( arr[ i ], i );
          if ( _new !== null ) {
            ret[ ret.length ] = _new;
          }
        }
        return ret.concat.apply( [], ret );
      }, 
      /** 
       *  $.grep( array, expression, function ) -> Object, values that match [expression] and/or [function]
       **/  
      grep:         function( arr, expr_fn, fn ) {
        var ret  = [], expr; 
        
        if ( Pollen.evaluate.isFn(expr_fn) ) {
          return Pollen.array.filter(arr, expr_fn);
        }
        
        expr    = !Pollen.evaluate.isRegExp(expr_fn) ?  Pollen.string._regExpEscape(expr_fn) : expr_fn;
        
        Pollen.array.each(arr, function(i, val) { 
          
          if ( typeof val === 'number' ) {
            val  = val + '';
          }

          if ( val.match(expr) ) {
            
            ret[ ret.length ] = fn ? fn.call(arr, val, i) :  val;

          }        
        });

        return ret;
      },
         
      /** 
       *  $.size( array ) -> Int, size of arr
       **/ 
       
      size:         function( arg ) {
        if ( Pollen.evaluate.isArr(arg) || Pollen.evaluate.isStr(arg) ) {
          return Pollen.array.toArray( arg ).length;
        }
        
        if ( Pollen.evaluate.isObj(arg) ) {
          
          var count = 0;
        
          for ( var prop in arg ) {
            if ( !Pollen.evaluate.isNull(arg[prop]) ) {
              count++;
            }
          }
          
          return count;
        }
        
        return Pollen.array.toArray( arg ).length;
      },
      pick: function( arr, prop ) {
        var ret = [];
        Pollen.array.each(arr, function(i, val) {
          ret[ ret.length ] = val[prop];
        });
        return ret;
      },      
      sortBy: function( arr, iter, cntxt ) {
        return Pollen.array.map(arr, function(val, i) {
          return {
            value: val,
            criteria: iter.call(cntxt, val, i)
          };
        }).sort(function(left, right) {
          var a = left.criteria, b = right.criteria;
          return a < b ? -1 : a > b ? 1 : 0;
        }).pick('value');
      },      

      
      compact:  function( arg ) {
        var _filter   = [undefined,null,false],
            ret   = Pollen.evaluate.isArr(arg) ? [] : {}, 
            _compact  = function ( value ) {
              var len = value.length, key = '';

              for ( var i in value ) {
                key = value [ i ];
                if (  Pollen.evaluate.isArr(key) ) {
                  _compact( key );
                } else {
                  
                  if ( !Pollen.evaluate.eq(key, [undefined,null,false] ) ) {
                    if ( Pollen.evaluate.isArr(ret) ) {
                      ret[ ret.length ] = key;
                    }
                    else {
                      ret[key] = key;
                    }
                  }
                }
              }
              return true;
            };

        _compact(arg);
        return ret;
      }
    },
    /**
      Object
    */
    object: {
      //  Object
      keys:         function( obj ) {
        var ret = [];
        for (var _prop in  obj ) {
          if (  obj[_prop] ) {
            ret[ ret.length ] = _prop;
          }
        }        
        return ret;
      },
      values:       function( obj ) {
        var ret = [];
        for (var _prop in  obj )   {
          if (  obj[_prop] ) {          
            ret[ ret.length ] = obj[_prop];
          }
        }      
        return ret;
      },
      /** 
       *  $.extend( object, _object ) -> Object, copy properties fron [_object] to [object]
       **/       
      extend:       function( obj , src) { 
        
        if ( Pollen.evaluate.isNull(obj) && Pollen.evaluate.isDef(src) ) {
          return src;
        }
        
        for (var prop in src) { 
          if ( hasOwn.call(src, prop ) ) {
            var srcProp  = src[prop],
                objProp  =  obj[prop]; 
              
              if ( !Pollen.evaluate.isNull(srcProp) ) {
                obj[prop]   = (objProp && typeof srcProp == 'object' && typeof objProp == 'object') ? 
                                Pollen.array.merge(objProp, srcProp) : 
                                srcProp; 
              }                                
          } 
        } 
        return  obj ; 
      }
    }, 
    /**
      Ajax
    */
    ajax: { 
      _options: {
        url:      '',
        data:     '',
        dataType: '',
        success:  Pollen.noop, //$.fn,//  
        type:     'GET',
        //  TODO: FIX THIS.
        sync:     navigator.userAgent.toLowerCase().indexOf('safari/') != -1 ? false : true,
        xhr:      function()  {
          return new XMLHttpRequest();
        }
      },
      /** 
       *  $.ajax.get( request ) -> Implemented. Documention incomplete.
       *  --> request.url     ->  url to open
       *  --> request.data    ->  params
       *  --> request.success ->  success callback
       **/     
      get:      function(request) { 
        request.type = 'GET';
        this._ajax(request);
      }, 
      /** 
       *  $.ajax.post( request ) -> Implemented. Documention incomplete.
       *  --> request.url     ->  url to open
       *  --> request.data    ->  params
       *  --> request.success ->  success callback
       **/     
      post:     function(request) { 
        request.type = 'POST';
        this._ajax(request);
      },       
      _ajax:     function(request) {
        var options   = Pollen.object.extend( this._options, request ),
            json      = options.dataType == 'json' ? true : false, // change to accept data-types not specifically json.
            _type     = options.type.toLowerCase(),
            _xhr      = options.xhr(),
            ajaxSuccess = options.success;
        
        
        
        if ( !Pollen.evaluate.isStr(options.data)  ) {
          options.data = Pollen.data.param(options.data);
        }
        
        if ( _type == 'get' && options.data.length ) {
          options.url += (  (new RegExp(/\?/)).test(options.url) ? '&' : '?'  ) + options.data;
        }
        
        if (_xhr) {
          Pollen.ajax._confXHR(_xhr, options, json, ajaxSuccess); 
          _xhr.open(options.type, options.url, options.sync); 
          _xhr.setRequestHeader('X-Requested-With', 'Worker-XMLHttpRequest'); 
          _xhr.setRequestHeader('X-Worker-Hive', 'Pollen-JS' ); 
          
          if ( Pollen.evaluate.isDef(Pollen.identity) ) {
            _xhr.setRequestHeader('X-Pollen-Thread-Id', Pollen.identity ); 
          }

          if ( _type == 'post' ) {
            _xhr.setRequestHeader('Content-Type',    'application/x-www-form-urlencoded'); 
          }
          
          _xhr.send(  _type == 'post' ? options.data : null ); 
        } 
      },
      _confXHR: function(_cxhr, options, json, ajaxSuccess) { 
        
        var data, _xjson;
        
        var onreadystatechange = _cxhr.onreadystatechange = function() {
          
          if (_cxhr.readyState == 4) { 
            
            _xjson  = Pollen.evaluate.isJson(_cxhr.responseText) ? JSON.parse(_cxhr.responseText) : null;
            
            data    = json ? _xjson : { 
                                        text: _cxhr.responseText, 
                                        xml:  _cxhr.responseXML,
                                        json: _xjson
                                      };    
            success();
          } 
        }; 
        
        //  scopify the success callback
        function success() {
          if ( ajaxSuccess ) {
            ajaxSuccess.call( _cxhr, data );
          }
        }        
        
        return _cxhr;
      }
    }, 
    /**
      Data Manip
    */
    data: {
      /** 
       *  $.param( arg ) -> String, Derived and Adapted from, similar in behavior to jQuery.param()
       **/     
      param: function ( arg ) {
        //  Adapted from jQuery.param()  
        var ret = [];
        
        function add( key, value ) {
          // If value is a function, invoke it and return its value
          value = Pollen.evaluate.isFn(value) ? value() : value;
          ret[ ret.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        }
        
        
        //  TO DO: THIS each() call needs to be updated
        Pollen.array.each( arg, function( key, value ) {
          add( key, value );
        });
        
        //  Enforce Thread Identity
        if ( arguments.length == 2 && arguments[1] === true ) {
          add( 'WORKER_ID', Pollen.identity);
        }

        return ret.join("&").replace(/%20/g, '+');
      },
      /**
        basic storage, needs A LOT of work
        basically right now this is a place holder and nothing more
      */
      cache: {
        "pollen"  : +new Date()
      },   
      /** 
       *  $.storage( key, val ) -> ?, persistant across worker messages (by worker) data storage - setter
       *  $.storage( key ) -> Val, persistant across worker messages (by worker) data storage - getters
       **/       
      storage: function ( key, value ) {
        
        if ( key && value === undefined ) {
          return Pollen.data.cache[key] ? Pollen.data.cache[key] : false;
        }
        
        Pollen.data.cache[key]  = value;

        return  Pollen.data.cache[key];
      },
      /*
      http://goessner.net/articles/JsonPath/
      C. Jason E. Smith, Apache License, Version 2.0 (the "License");
            
      OVERVIEW:
      JSONPath api (http://goessner.net/articles/JsonPath/) - Similar to XQuery.
      JSONQuery.js By Jon Crosby
      */
      /** 
       *  $.query( selector, object ) -> *, Query json or object with JSONPath selector
       *  --> http://goessner.net/articles/JsonPath/
       **/        
      query:     (function(){
                    //  Special case slice
                    function slice(obj,start,end,step){
                      // handles slice operations: [3:6:2]
                      var len=obj.length,ret = [];
                      end   = end || len;
                      start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
                      end   = (end < 0) ? Math.max(0,end+len) : Math.min(len,end);
                      for(var i=start; i<end; i+=step){
                         ret[ ret.length ] = obj[i] ;
                      }
                      return ret;
                    }
                    function expand(obj,name){
                      // handles ..name, .*, [*], [val1,val2], [val]
                      // name can be a property to search for, undefined for full recursive, or an array for picking by index
                      var ret = [];
                      function walk(obj){
                        if(name){
                          if(name===true && !(obj instanceof Array)){
                            //recursive object search
                            ret[ ret.length ] = obj;
                          }else if(obj[name]){
                            // found the name, add to our results
                            ret[ ret.length ] = obj[name];
                          }
                        }
                        for(var i in obj){
                          var val = obj[i];
                          if(!name){
                            // if we don't have a name we are just getting all the properties values (.* or [*])
                            ret[ ret.length ] = val;
                          }else if(val && typeof val == 'object'){

                            walk(val);
                          }
                        }
                      }
                      if( Pollen.evaluate.isArr(name) ){
                        // this is called when multiple items are in the brackets: [3,4,5]
                        if(name.length==1){
                          // this can happen as a result of the parser becoming confused about commas
                          // in the brackets like [@.func(4,2)]. Fixing the parser would require recursive
                          // analsys, very expensive, but this fixes the problem nicely.
                          return obj[name[0]];
                        }
                        for(var i = 0; i < name.length; i++){
                          ret[ ret.length ] = obj[name[i]];
                        }
                      }else{
                        // otherwise we expanding
                        walk(obj);
                      }
                      return ret;
                    }

                    function distinctFilter(arr, fn){
                      // does the filter with removal of duplicates in O(n)
                      var ret = [],primitives = {}, len = arr.length, i=0;
                      for( ; i<len; ++i ){
                        var value = arr[i];
                        if( fn(value, i, arr) ){
                          if((typeof value == 'object') && value){
                            // with objects we prevent duplicates with a marker property
                            if(!value.__included){
                              value.__included = true;
                              ret[ ret.length ] = value;
                            }
                          }else if(!primitives[value + typeof value]){
                            // with primitives we prevent duplicates by putting it in a map
                            primitives[value + typeof value] = true;
                            ret[ ret.length ] = value;
                          }
                        }
                      }
                      for(i=0,len=ret.length; i<len; ++i){
                        // cleanup the marker properties
                        if(ret[i]){
                          delete ret[i].__included;
                        }
                      }
                      return ret;
                    }
                    
                    return function(query,obj){
                        
                        var depth = 0,strs = [], prefix = '', executor = '';
                        
                        function pcall(name){
                          // creates a function call and puts the current expression in a parameter for a call
                          prefix = name + "(" + prefix;
                        }
                        function makeRegex(t,a,b,c,d){
                          // creates a regular expression matcher for when wildcards and ignore case is used
                          return strs[d].match(/[\*\?]/) || c == '~' ?
                              "/^" + strs[d].substring(1,strs[d].length-1).replace(/\\([btnfr\\"'])|([^\w\*\?])/g,"\\$1$2").replace(/([\*\?])/g,".$1") + (c == '~' ? '$/i' : '$/') + ".test(" + a + ")" :
                              t;
                        }

                        query = query.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|[\[\]]/g,function(t){
                          depth += t == '[' ? 1 : t == ']' ? -1 : 0; // keep track of bracket depth
                          return (t == ']' && depth > 0) ? '`]' : // we mark all the inner brackets as skippable
                              (t.charAt(0) == '"' || t.charAt(0) == "'") ? "`" + (strs.push(t) - 1) :// and replace all the strings
                                t;
                          })
                          // change the equals to comparisons
                          .replace(/([^<>=]=)([^=])/g,"$1=$2")
                          .replace(/@|(\.\s*)?[a-zA-Z\$_]+(\s*:)?/g,function(t){
                            return t.charAt(0) == '.' ? t : // leave .prop alone
                              t == '@' ? "$obj" :// the reference to the current object
                              (t.match(/:|^(\$|Math|true|false|null)$/) ? "" : "$obj.") + t; // plain names should be properties of root... unless they are a label in object initializer
                          })
                          .replace(/\.?\.?\[(`\]|[^\]])*\]|\?.*|\.\.([\w\$_]+)|\.\*/g,function(t,a,b){
                            var oper = t.match(/^\.?\.?(\[\s*\^?\?|\^?\?|\[\s*==)(.*?)\]?$/); // [?expr] and ?expr and [=expr and =expr
                            if(oper){
                              var prefix = '';
                              if(t.match(/^\./)){
                                // recursive object search
                                pcall("expand");
                                prefix = ",true)";
                              }
                              pcall(oper[1].match(/\=/) ? "Pollen.array.map" : oper[1].match(/\^/) ? "distinctFilter" : "Pollen.array.filter");
                              return prefix + ",function($obj){return " + oper[2] + "})";
                            }
                            oper = t.match(/^\[\s*([\/\\].*)\]/); // [/sortexpr,\sortexpr]
                            if(oper){
                              // make a copy of the array and then sort it using the sorting expression
                              return ".concat().sort(function(a,b){" + oper[1].replace(/\s*,?\s*([\/\\])\s*([^,\\\/]+)/g,function(t,a,b){
                                  return "var av= " + b.replace(/\$obj/,"a") + ",bv= " + b.replace(/\$obj/,"b") + // FIXME: Should check to make sure the $obj token isn't followed by characters
                                      ";if(av>bv||bv==null){return " + (a== "/" ? 1 : -1) +";}\n" +
                                      "if(bv>av||av==null){return " + (a== "/" ? -1 : 1) +";}\n";
                              }) + "})";
                            }
                            oper = t.match(/^\[(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)\]/); // slice [0:3]
                            if(oper){
                              pcall("slice");
                              return "," + (oper[1] || 0) + "," + (oper[2] || 0) + "," + (oper[3] || 1) + ")";
                            }
                            if(t.match(/^\.\.|\.\*|\[\s*\*\s*\]|,/)){ // ..prop and [*]
                              pcall("expand");
                              return (t.charAt(1) == '.' ?
                                  ",'" + b + "'" : // ..prop
                                    t.match(/,/) ?
                                      "," + t : // [prop1,prop2]
                                      "") + ")"; // [*]
                            }
                            return t;
                          })
                          .replace(/(\$obj\s*(\.\s*[\w_$]+\s*)*)(==|~)\s*`([0-9]+)/g,makeRegex)
                          // create regex matching
                          .replace(/`([0-9]+)\s*(==|~)\s*(\$obj(\s*\.\s*[\w_$]+)*)/g,function(t,a,b,c,d){ // and do it for reverse =
                            return makeRegex(t,c,d,b,a);
                          });
                        
                        query = prefix + (query.charAt(0) == '$' ? "" : "$") + query.replace(/`([0-9]+|\])/g,function(t,a){
                          //restore the strings
                          return a == ']' ? ']' : strs[a];
                        });
                        // create a function within this scope (so it can use expand and slice)

                        executor = eval("1&&function($,$1,$2,$3,$4,$5,$6,$7,$8,$9){var $obj=$;return " + query + "}");
                        
                        for( var i = 0; i< arguments.length-1; i++ ){
                          arguments[i] = arguments[i+1];
                        }
                        return obj ? executor.apply(this,arguments) : executor;
                      }


                  })()      
    },    
    worker: {
      /**
        TODO - NEW FEATURE
        
        - Add Support for workers to spawn new workers.
        
        - Add Support for EventSource
    
      */

      /** 
       *  $.send( message ) -> Wraps and normalizes postMessage() across supporting clients, sends [message](object||string||array) to client
       *  --> if [message] is an object, and message.SEND_TO & message.SEND_FROM is defined, the message will be sent directly to the worker defined by SEND_TO
       **/       
      send:   function ( message ) {
        
        var _msg  = message, _msgStr;
        
        if ( !Pollen.evaluate.isDef(message) ) {
          return;
        }
        
        if ( !Pollen.evaluate.isObj(message) ) {
          _msg  = {
            "message": message
          };
        }
        
        if ( message.SEND_TO ) {
          _msg.SEND_FROM = Pollen.identity;
        }
        
        _msg.WORKER_ID  = Pollen.identity;


        return postMessage( _msg );
        
      },
      //  DEPRECATE
      reply:   function (message) {
        //  Thread specific postMessage wrapper
        return Pollen.worker.send(message);  
        //  the 'explicit' arg is no longer checked  
        //  has been removed
      },
      /** 
       *  $.receive( function ) -> Worker, execute [function] when worker receives a message from the client
       *  --> first argument is message object
       *  --> 'this' is WorkerGlobalScope
       *  --> can be shortened to $(function (message) { } );
       **/       
      receive:   function (fn) {
        //  Worker receives message, behaviour is similar to $().ready()
        return  addEventListener('message', function (event) {
          
          var message     = event.data;
          
          if ( Pollen.identity == '' ) {
            Pollen.identity = message.WORKER_ID;
          }

          return fn.call(event, message);

        }, false);      
      }
    },
    /**
      JSON2 Convenience shorthands
      
    */
    json: {
      /** 
       *  $.encode( arg ) -> JSON Object, turns [arg] into JSON (Convenience shorthand)
       **/       
      encode:     JSON.parse,
      /** 
       *  $.decode( arg ) -> JSON as String, turns JSON [arg] into a str  (Convenience shorthand)
       **/       
      decode:     JSON.stringify
    }
  };
  
  //  Create an instance of Pollen
  Pollen = new Pollen;
  
  p = $ = new function WorkerOnMessage() {
    if ( arguments.length ) {
      if ( Pollen.evaluate.isFn(arguments[0]) ) {

        return Pollen.worker.receive(arguments[0]);

      }
    }
    return WorkerOnMessage;
  };
  
  p.ajax = $.ajax  = Pollen.ajax;
  
  //  Sub Module Objects to attach to Pollen/$ root
  ('identify date string evaluate reflection array func object data json worker')
    .split(' ')
      .forEach(function (obj) {
        //  Copy specific module methods back to $ for concise and convenient syntax
        for ( var prop in Pollen[obj] ) {
          p[prop] = $[prop]  = Pollen[obj][prop];  
        }
      });
      
})(this);
