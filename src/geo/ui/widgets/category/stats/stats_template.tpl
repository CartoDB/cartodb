<% if (isSearchEnabled) { %>
  <dt class="Widget-infoItem">
    <% if (isSearchApplied) { %>
      <%- resultsCount %> found
    <% } else { %>
      &nbsp;
    <% } %>
  </dt>
<% } else { %>
  <dt class="Widget-infoItem"><%- nullsPer %>% null rows</dt>
  <dt class="Widget-infoItem"><%- catsPer %>% in <%- totalCats %> categor<%- totalCats !== 1 ? 'ies' : 'y' %></dt>
<% } %>
