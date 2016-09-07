<p class="CDB-Legend-Title"><%= title %></p>
<p>FILL COLOR: <%= fillColor %></p>
<% if (bubbles && bubbles.length > 0) { %>
  <ul>
    <% for(var bubble in bubbles) { %>
      <li>Bubble height: <%= bubbles[bubble] %></li>
    <% } %>
  </ul>
<% } else { %>
  <p>No bubbles</p>
<% }%>

<% if (avg) { %>
  <p>AVG: <%= avg %></p>
<% } %>
