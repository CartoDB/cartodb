<% if (title) { %>
  <h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl"><%= title %></h2>
<% } %>

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
