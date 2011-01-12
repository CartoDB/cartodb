
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
  
  // if (i==999 || i==1 || i==300) {
  //   var new_feature = new Object();
  //   new_feature.geometry = new Object();
  //   new_feature.geometry.coordinates = [[ [-122.258+ Math.random(), 37.805+ Math.random()], [-122.258+ Math.random(), 37.805+ Math.random()], [-122.258+ Math.random(), 37.805+ Math.random()], [-122.258+ Math.random(), 37.805+ Math.random()], [-122.258+ Math.random(), 37.805+ Math.random()] ]];
  //   new_feature.geometry.type = "Polygon";
  //   points.push(new_feature);
  // }

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
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));

map.add(po.geoJson()
    .features(points)  
    .on('load',load));

map.add(po.compass()
    .pan("none"));




/** Post-process the GeoJSON points and replace them with shiny balls! */
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
    
    
    //     
    //     e.features[i].element.setAttribute('onclick','removeFill(evt)');
    //     e.features[i].element.setAttribute('stroke','black');
    //     e.features[i].element.setAttribute('stroke-width','1');
    
    
    // var c = n$(e.features[i].element),
    //     g = c.parent().add("svg:g", c);
    // 
    // g.add(c
    //     .attr("fill", "white")
    //     .attr("stroke-width",1)
    //     .attr("stroke","black")
    //     .attr("r", 5)
    //     .attr("cx", null)
    //     .attr("cy", null));
    
    // var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    // polygon.setAttribute("points", "0,0 100,100 200,200");
    // polygon.setAttribute("fill","red");
    // 
    // var c = n$(e.features[i].element),
    //             g = c.parent().add(polygon, c);        
  }
}

function removeFill(evt) {
  
  console.log(evt);
  
  // var element = evt.target;
  // var red = Math.round(Math.random() * 255);
  // var green = Math.round(Math.random() * 255);
  // var blue = Math.round(Math.random() * 255); 
  // element.setAttribute("fill","rgb("+ red +","+ green+","+blue+")");
  // var red = Math.round(Math.random() * 255);
  // var green = Math.round(Math.random() * 255);
  // var blue = Math.round(Math.random() * 255);
  // element.setAttribute("stroke","rgb("+ red +","+ green+","+blue+")");
}



// $(document).ready(function(){
//   $('circle').live('click',function(ev){
//     console.log(ev);
//     alert(ev);
//   });
// });
