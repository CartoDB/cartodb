<% if (isSearchEnabled) { %>
  <dt class="Widget-infoItem">
    <% if (isSearchApplied) { %>
      <%- resultsCount %> found
    <% } else { %>
      &nbsp;
    <% } %>
  </dt>
<% } else { %>
  <dt class="Widget-infoItem"><%- nulls %> null rows</dt>
  <dt class="Widget-infoItem"><%- min %> min</dt>
  <dt class="Widget-infoItem"><%- max %> max</dt>
<% } %>
