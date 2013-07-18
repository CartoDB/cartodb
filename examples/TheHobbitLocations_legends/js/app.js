var map;

function main() {

  var options = {
    center: [-42.27730877423707, 172.63916015625],
    zoom: 6,
    zoomControl: false,  // dont add the zoom overlay (it is added by default)
    loaderControl: false //dont show tiles loader
  };

  cartodb.createVis('map', 'http://saleiva.cartodb.com/api/v1/viz/thehobbit_filmingloc/viz.json', options)
    .done(function(vis, layers) {


      // there are two layers, base layer and points layer
      var sublayer = layers[1].getSubLayer(0);
      //sublayer.setInteractivity(['cartodb_id', 'name_to_display', 'description']);

      // Set the custom infowindow template defined on the html
      sublayer.infowindow.set('template', $('#infowindow_template').html());

      // add the tooltip show when hover on the point
      vis.addOverlay({
        type: 'tooltip',
        template: '<p>{{name_to_display}}</p>'
      });

      vis.addOverlay({
        type: 'infobox',
        template: '<h3>{{name_to_display}}</h3><p>{{description}}</p>',
        width: 200,
        position: 'bottom|right'
      });

      var legendA = new cdb.geo.ui.Legend({
        type: "choropleth",
        data: [
          { name: "21,585",     value: "#FFC926" },
          { name: "Category 2", value: "#76EC00" },
          { name: "Category 3", value: "#00BAF8" },
          { name: "91,585",     value: "#D04CFD" }
        ]
      });

      var legendB = new cdb.geo.ui.Legend({
        type: "bubble",
        data: [
          { name: "21,585",     value: "#FFC926" },
          { name: "Category 2", value: "#76EC00" },
          { name: "Category 3", value: "#00BAF8" },
          { name: "91,585",     value: "#D04CFD" }
        ]
      });

      var legendC = new cdb.geo.ui.Legend({
        data: [
          { name: "21,585",     value: "#FFC926" },
          { name: "Category 2", value: "#76EC00" },
          { name: "Category 3", value: "#00BAF8" },
          { name: "91,585",     value: "#D04CFD" }
        ]
      });

      var stackedLegend = new cdb.geo.ui.StackedLegend({
        legends: [legendA, legendB, legendC]
      });

      //window.legend = legend;
      window.stackedLegend = stackedLegend;

      $("#overlay").append(stackedLegend.render().$el);


    });

}

window.onload = main;
