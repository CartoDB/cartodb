<div class="u-flex u-justifySpace u-bSpace">
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%= formatter.formatNumber(colors[0].label) %> <%- suffix %></p>
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%= formatter.formatNumber(colors[colors.length-1].label) %> <%- suffix %></p>
</div>
<div class="Legend-choropleth" style="opacity:1; background: linear-gradient(90deg <% for(var i in colors) { %>,<%= colors[i].value %><% } %>);">
  <span class="Legend-choroplethAverage CDB-Text CDB-Size-small u-altTextColor" style="opacity:1; left: <%- avgPercentage %>%;">
    <span class="Legend-choroplethAverageText"><%= formatter.formatNumber(avg) %> AVG</span>
  </span>
</div>
