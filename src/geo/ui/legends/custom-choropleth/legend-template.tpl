<div class="u-flex u-justifySpace u-bSpace--m">
  <% if (hasCustomLabels) { %>
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%= leftLabel %> <%- suffix %></p>
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%= rightLabel %> <%- suffix %></p>
  <% } else { %>
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%- suffix %></p>
  <p class="CDB-Text CDB-Size-small"><%- prefix %> <%- suffix %></p>
  <% } %>
</div>
<div class="Legend-choropleth" style="opacity:1; background: linear-gradient(90deg <% for(var i in colors) { %>,<%= colors[i].color %><% } %>);"></div>
