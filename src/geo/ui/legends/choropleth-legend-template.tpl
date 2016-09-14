<div class="u-flex u-justifySpace u-bSpace--m">
  <p class="CDB-Text CDB-Size-small is-semibold"><%= prefix %> 10 <%= sufix %></p>
  <p class="CDB-Text CDB-Size-small is-semibold"><%= prefix %> 100 <%= sufix %></p>
</div>
<% if (colors && colors.length > 0) { %>
  <div class="Legend-choropleth" style="background: linear-gradient(90deg <% for(var i in colors) { %>,<%= colors[i] %><% } %>)">
    <span class="Legend-choroplethAverage CDB-Text CDB-Size-small u-altTextColor" style="left: 39%;">58K AVG</span>
  </div>
<% } else { %>
  <p>No color ramp</p>
<% }%>
 