<div class="u-flex u-justifySpace u-bSpace--m">
  <p class="CDB-Text CDB-Size-small"><%= prefix %> <%= colors[0].label %> <%= sufix %></p>
  <p class="CDB-Text CDB-Size-small"><%= prefix %> <%= colors[colors.length-1].label %> <%= sufix %></p>
</div>
<div class="Legend-choropleth" style="background: linear-gradient(90deg <% for(var i in colors) { %>,<%= colors[i].value %><% } %>)">
  <span class="Legend-choroplethAverage CDB-Text CDB-Size-small u-altTextColor" style="left: 39%;"><%= avg %> AVG</span>
</div>
 