<% if (isSearchEnabled) { %>
    <% if (isSearchApplied) { %>
      <dt class="CDB-Widget-infoCount"><%- resultsCount %></dt><dd class="CDB-Widget-infoDescription">found</dd>
    <% } else { %>
      &nbsp;
    <% } %>
  </dt>
<% } else { %>
  <dt class="CDB-Widget-infoCount"><%- nullsPer %>%</dt><dd class="CDB-Widget-infoDescription"> null rows</dd>
  <dt class="CDB-Widget-infoCount"><span class="js-cats"><%- catsPer %></span>%</dt><dd class="CDB-Widget-infoDescription">of total</dd>
<% } %>
