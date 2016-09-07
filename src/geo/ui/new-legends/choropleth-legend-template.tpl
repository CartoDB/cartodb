<p class="CDB-Legend-Title"><%= title %></p>
<p>PREFIX: <%= prefix %></p>
<p>SUFIX: <%= sufix %></p>
<% if (colors && colors.length > 0) { %>
  <ul>
    <% for(var i in colors) { %>
      <li><%= colors[i] %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>No color ramp</p>
<% }%>
