<div class="u-flex u-justifySpace u-bSpace--m">
  <p class="CDB-Text CDB-Size-small is-semibold">PREFIX: <%= prefix %></p>
  <p class="CDB-Text CDB-Size-small is-semibold">SUFIX: <%= sufix %></p>
</div>
<% if (colors && colors.length > 0) { %>
  <div class="Legend-choropleth" style="background: linear-gradient(90deg <% for(var i in colors) { %>,<%= colors[i] %><% } %>)"></div>
<% } else { %>
  <p>No color ramp</p>
<% }%>
