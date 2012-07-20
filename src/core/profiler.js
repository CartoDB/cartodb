
// =================
// profiler
// =================

(function() {
  function Profiler() {}
  Profiler.times = {};
  Profiler.new_time = function(type, time) {
      var t = Profiler.times[type] = Profiler.times[type] || {
          max: 0,
          min: 10000000,
          avg: 0,
          total: 0,
          count: 0
      };

      t.max = Math.max(t.max, time);
      t.total += time;
      t.min = Math.min(t.min, time);
      ++t.count;
      t.avg = t.total/t.count;
  };

  Profiler.new_value = Profiler.new_time;

  Profiler.print_stats = function() {
      for(k in Profiler.times) {
          var t = Profiler.times[k];
          console.log(" === " + k + " === ");
          console.log(" max: " + t.max);
          console.log(" min: " + t.min);
          console.log(" avg: " + t.avg);
          console.log(" total: " + t.total);
      }
  };

  Profiler.get = function(type) {
      return {
          t0: null,
          start: function() { this.t0 = new Date().getTime(); },
          end: function() {
              if(this.t0 !== null) {
                  Profiler.new_time(type, this.time = new Date().getTime() - this.t0);
                  this.t0 = null;
              }
          }
      };
  };

  cdb.core.Profiler = Profiler;

  Profiler.ui = function() {
    var _$ied;
    if(!_$ied){
        _$ied = $('<div></div>').css({
          'position': 'fixed',
          'bottom': 10,
          'left': 10,
          'zIndex': 20000,
          'width': $('body').width() - 80,
          'border': '1px solid #000',
          'padding': '30px',
          'backgroundColor': '#fff',
          'fontFamily': 'arial,helvetica,sans-serif',
          'fontSize': '14px',
          'lineHeight': '1.3em'
        });
        $('body').append(_$ied);
    }
    this.el = _$ied;
    var update = function() {
        for(k in Profiler.times) {
          var pid = '_prof_time_' + k;
          var p = $('#' + pid);
          if(p.length === 0) {
            p = $('<div>').attr('id', pid)
            var t = Profiler.times[k];
            var div = $('<div>').append('<h1>' + k + '</h1>').css({
              'font-weight': 'bold',
              'margin': '10px 0'
            })
            for(var c in t) {
              p.append(div.append($('<div>').append('<span style="display: inline-block; width: 60px;font-weight:  300;">' + c + '</span><span class="'+  c + '"></span>')));
            }
            _$ied.append(p);
          }
          // update ir
          var t = Profiler.times[k];
          for(var c in t) {
            p.find('.' + c).html(t[c]);
          }
        }
    }
    setInterval(function() {
      update();
    }, 1000);
    /*var $message = $('<li>'+message+' - '+vars+'</li>').css({
        'borderBottom': '1px solid #999999'
      });
      _$ied.find('ol').append($message);
      _.delay(function() {
        $message.fadeOut(500);
      }, 2000);
    };
    */
  };

})();
