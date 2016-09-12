<% if (title) { %>
  <h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl"><%= title %></h2>
<% } %>

<% if (items && items.length > 0) { %>
  <ul>
    <% for(var i in items) { %>
      <li><%= items[i].name %>: <%= items[i].color %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>No items</p>
<% }%>
