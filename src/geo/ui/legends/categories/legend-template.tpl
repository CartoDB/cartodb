<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li class="Legend-categoryListItem u-flex u-justifySpace u-alignCenter">
        <p class="Legend-categoryTitle CDB-Text CDB-Size-small u-upperCase u-ellipsis" title="<%= categories[i].label %>"><%= categories[i].label %></p>
        <span class="Legend-categoryCircle" style="opacity:1; background: <%= categories[i].value %>;"></span>
      </li>
    <% } %>
  </ul>
<% }%>
