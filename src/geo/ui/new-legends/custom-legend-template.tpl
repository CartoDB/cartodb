<p class="CDB-Legend-Title"><%= title %></p>

<% if (items && items.length > 0) { %>
  <ul>
    <% for(var i in items) { %>
      <li><%= items[i].name %>: <%= items[i].color %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>No items</p>
<% }%>
