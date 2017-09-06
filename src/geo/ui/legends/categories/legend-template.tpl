<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li class="Legend-categoryListItem u-flex u-alignCenter">
        <% if (categories[i].icon) { %>
          <span class="Legend-categoryIcon js-image-container" data-icon="<%= categories[i].icon %>" data-color="<%= categories[i].color %>"></span>
        <% } else if (categories[i].color) { %>
          <span class="Legend-categoryCircle" style="opacity:1; background: <%= categories[i].color %>;"></span>
        <% } %>
        <p class="Legend-categoryTitle CDB-Text CDB-Size-small u-upperCase u-ellipsis" title="<%= categories[i].title %>"><%= categories[i].title %></p>
      </li>
    <% } %>
  </ul>
<% }%>
