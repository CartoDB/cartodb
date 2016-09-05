<p class="CDB-Legend-Title"><%= title %></p>

<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li><%= categories[i].name %>: <%= categories[i].color %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>Loading...</p>
<% }%>
