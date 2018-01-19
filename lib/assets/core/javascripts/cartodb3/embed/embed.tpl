<% if (showMenu) { %>
  <header class="CDB-Embed-header">
    <h1 class="CDB-Text CDB-Size-large"><%= title %></h1>
  </header>
<% } %>

<% if (showLegends) { %>
  <div class="CDB-Embed-tabs CDB-NavMenu js-tabs"></div>
<% } %>

<div class="CDB-Embed-content">
  <div class="CDB-Embed-map js-embed-map"></div>

  <% if (showLegends) { %>
    <div class="CDB-Embed-legends js-embed-legends"></div>
  <% } %>

  <div class="CDB-Embed-map js-embed-newtab"></div>
</div>
