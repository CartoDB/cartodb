<% if (isSearchEnabled) { %>
  <dt class="CDB-Widget-infoItem">
    <% if (isSearchApplied) { %>
      <%- resultsCount %> found
    <% } else { %>
      &nbsp;
    <% } %>
  </dt>
<% } else { %>
  <dt class="CDB-Widget-infoItem"><%- nullsPer %>% null rows</dt>
  <dt class="CDB-Widget-infoItem">
    <span class="js-cats"><%- catsPer %></span>% of total
  </dt>
<% } %>
