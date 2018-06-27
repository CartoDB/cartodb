var WIDTH = 300,
  HEIGHT = 280,
  MARGINS = {
    top: 10,
    right: 10,
    bottom: 20,
    left: 70
  };

function initVizu() {

  d3.select("#visualisation").remove();
  var canvas = d3.select("#widget1").append("svg")
    .attr("id", "visualisation")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  return canvas;
}

function vizu(data, vis) {

  var dataGroup = d3.nest()
    .key(function(d) {
      return d.secteur;
    })
    .entries(data);
  //console.log(data)
  dataGroup.forEach(function(d) {
    d.values.forEach(function(e) {
      var myArr = [];
      for (var key in e) {
        if (e[key] != d.key) {
          myArr.push({
            "year": key.replace('ca', ''),
            "value": Number(e[key])
          });
        }
      }
      d.values = myArr;
    })
  })

  var color = d3.scale.category10(),
    lSpace = WIDTH;

  xScale = d3.scale.linear().domain(["2012", "2016"]).range([MARGINS.left, WIDTH - MARGINS.right]),
    yScale = d3.scale.linear().range([HEIGHT - 2 * MARGINS.top, MARGINS.bottom]).domain([0, d3.max(data, function(d) {
      if (d.ca2012 > d.ca2016) {
        return d.ca2012 * 1.2;
      } else {
        return d.ca2016 * 1.2;
      };
    })]),
    xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(5)
    .tickFormat(d3.format("f"))

  yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");

  vis.append("svg:g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
    .call(xAxis);
  vis.append("svg:g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + (MARGINS.left) + ",0)")
    .call(yAxis);

  var lineGen = d3.svg.line()
    .x(function(d) {
      return xScale(d.year);
    })
    .y(function(d) {
      return yScale(d.value);
    })

  var line = vis.append('g')
    .attr("class", "lines");

  dataGroup.forEach(function(d, i) {
    line.append('svg:path')
      .style("opacity", 0)
      .transition().duration(500).style("opacity", 1)
      .attr('d', lineGen(d.values))
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4')
      .attr('id', 'line_' + d.key)
      .attr('stroke', function(j) {
        var expr = d.key;
        switch (expr) {
          case 'Commerce':
            return "#17c0eb";
            break;
          case 'Construction':
            return "#ffaf40";
            break;
          case 'Industrie':
            return "#ff3838";
            break;
          case 'Déchets':
            return "#b8e994";
            break;
          case 'Logistique':
            return "#38ada9";
            break;
          case 'Service':
            return "#7158e2";
            break;
        }
      })
      .attr('fill', 'none');
  });
  var node = vis.append("g")
    .attr("class", "nodes");

  dataGroup.forEach(function(d, i) {
    node.style("opacity", 0)

    for (var i = 0; i < 5; i++) {
      node.append('circle')
        .attr('cx', xScale(d.values[i].year))
        .attr('cy', yScale(d.values[i].value))
        .attr("r", 4)
        .attr('stroke-width', 2)
        .attr('stroke', "white")
        .attr('id', 'circle_' + d.key + i)
        .style("opacity", 1)
        .style('fill', function(j) {
          var expr = d.key;
          switch (expr) {
            case 'Commerce':
              return "#17c0eb";
              break;
            case 'Construction':
              return "#ffaf40";
              break;
            case 'Industrie':
              return "#ff3838";
              break;
            case 'Déchets':
              return "#b8e994";
              break;
            case 'Logistique':
              return "#38ada9";
              break;
            case 'Service':
              return "#7158e2";
              break;
            default:
              return 'none';
              break;
          };
        })
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
    };
    node.transition().duration(500).style("opacity", 1)
  });

  function mouseOver() {
    d3.select(this).transition().duration(200).style("opacity", 1).attr("r", 6)
      .attr('stroke', "white");
  }

  function mouseOut() {
    d3.select(this).transition().duration(200).style("opacity", 1).attr("r", 4);
  }
}