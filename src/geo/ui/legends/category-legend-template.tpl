<% if (title) { %>
  <h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl"><%= title %></h2>
<% } %>

<p>PREFIX: <%= prefix %></p>
<p>SUFIX: <%= sufix %></p>
<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li><%= categories[i].name %>: <%= categories[i].color %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>No categories</p>
<% }%>
