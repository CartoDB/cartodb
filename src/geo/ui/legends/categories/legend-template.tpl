<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li><%= categories[i].name %>: <%= categories[i].color %></li>
    <% } %>
  </ul>
<% }%>
