/*
# metrics profiler

## timing

```
 var timer = Profiler.metric('resource:load')
 time.start();
 ...
 time.end();
```

## counters

```
 var counter = Profiler.metric('requests')
 counter.inc();   // 1
 counter.inc(10); // 11
 counter.dec()    // 10
 counter.dec(10)  // 0
```

## Calls per second
```
  var fps = Profiler.metric('fps')
  function render() {
    fps.mark();
  }
```
*/
(function(exports) {

var MAX_HISTORY = 1024;
function Profiler() {}
Profiler.metrics = {};
Profiler._backend = null;

Profiler.get = function(name) {
  return Profiler.metrics[name] || {
    max: 0,
    min: Number.MAX_VALUE,
    avg: 0,
    total: 0,
    count: 0,
    last: 0,
    history: typeof(Float32Array) !== 'undefined' ? new Float32Array(MAX_HISTORY) : []
  };
};

Profiler.backend = function (_) {
  Profiler._backend = _;
}

Profiler.new_value = function (name, value, type, defer) {
  type =  type || 'i';
  var t = Profiler.metrics[name] = Profiler.get(name);


  t.max = Math.max(t.max, value);
  t.min = Math.min(t.min, value);
  t.total += value;
  ++t.count;
  t.avg = t.total / t.count;
  t.history[t.count%MAX_HISTORY] = value;

  if (!defer) {
    Profiler._backend && Profiler._backend([type, name, value]);
  } else {
    var n = new Date().getTime()
    // don't allow to send stats quick
    if (n - t.last > 1000) {
      Profiler._backend && Profiler._backend([type, name, t.avg]);
      t.last = n;
    }
  }
};

Profiler.print_stats = function () {
  for (k in Profiler.metrics) {
    var t = Profiler.metrics[k];
    console.log(" === " + k + " === ");
    console.log(" max: " + t.max);
    console.log(" min: " + t.min);
    console.log(" avg: " + t.avg);
    console.log(" count: " + t.count);
    console.log(" total: " + t.total);
  }
};

function Metric(name) {
  this.t0 = null;
  this.name = name;
  this.count = 0;
}

Metric.prototype = {

  //
  // start a time measurement
  //
  start: function() {
    this.t0 = +new Date();
    return this;
  },

  // elapsed time since start was called
  _elapsed: function() {
    return +new Date() - this.t0;
  },

  //
  // finish a time measurement and register it
  // ``start`` should be called first, if not this 
  // function does not take effect
  //
  end: function(defer) {
    if (this.t0 !== null) {
      Profiler.new_value(this.name, this._elapsed(), 't', defer);
      this.t0 = null;
    }
  },

  //
  // increments the value 
  // qty: how many, default = 1
  //
  inc: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, qty, 'i');
  },

  //
  // decrements the value 
  // qty: how many, default = 1
  //
  dec: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, qty, 'd');
  },

  //
  // measures how many times per second this function is called
  //
  mark: function() {
    ++this.count;
    if(this.t0 === null) {
      this.start();
      return;
    }
    var elapsed = this._elapsed();
    if(elapsed > 1) {
      Profiler.new_value(this.name, this.count);
      this.count = 0;
      this.start();
    }
  }
};

Profiler.metric = function(name) {
  return new Metric(name);
};

exports.Profiler = Profiler;

})(cdb.core);
