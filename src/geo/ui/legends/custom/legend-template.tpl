<ul>
  <% for(var i in items) { %>
    <li class="Legend-categoryListItem u-flex u-justifySpace u-alignCenter">
      <p class="CDB-Text CDB-Size-small u-upperCase"><%= items[i].name %></p>
      <span class="Legend-categoryCircle" style="background: <%= items[i].color %>"></span>
    </li>
  <% } %>
</ul>
