<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li class="Legend-categoryListItem u-flex u-justifySpace u-alignCenter">
        <p class="CDB-Text CDB-Size-small u-upperCase"><%= categories[i].name %></p>
        <span class="Legend-categoryCircle" style="background: <%= categories[i].color %>"></span>
      </li>
    <% } %>
  </ul>
<% }%>
