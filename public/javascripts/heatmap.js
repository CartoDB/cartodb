
var points = new Array();

for (var i=0; i<1000; i++) {
  var new_feature = new Object();
  new_feature.geometry = new Object();
  new_feature.geometry.coordinates = new Array(-122.258+ Math.random(), 37.805+ Math.random());
  new_feature.geometry.type = "Point";
  new_feature.id = i;
  new_feature.properties = new Object();
  new_feature.properties.species = Math.random()*200;
  points.push(new_feature);
}


var po = org.polymaps;

var svg = n$("#map").add("svg:svg");

var map = po.map()
    .container($n(svg))
    .center({lat: 37.787, lon: -122.228})
    .zoom(9)
    .add(po.interact());

map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af"
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));

map.add(po.geoJson()
    .features(points)  
    .on('load',load));

map.add(po.compass()
    .pan("none"));



function load(e) {
  for (var i = 0; i < e.features.length; i++) {
    var f = e.features[i].data;  
    e.features[i].element.addEventListener('click',function(ev){console.log(ev);});
    if (f.properties.species>=0 && f.properties.species<40) {
      e.features[i].element.setAttribute('fill','red');
    } else if (f.properties.species>=40 && f.properties.species<80) {
      e.features[i].element.setAttribute('fill','blue');
    } else if (f.properties.species>=80 && f.properties.species<120) {
      e.features[i].element.setAttribute('fill','yellow');
    } else if (f.properties.species>=120 && f.properties.species<160) {
      e.features[i].element.setAttribute('fill','white');
    } else {
      e.features[i].element.setAttribute('fill','green');
    }
    
  }
}

function removeFill(evt) {
  console.log(evt);
}
