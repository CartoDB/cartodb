<ul class="NotificationsDropdown ">
  <% if (items.length > 0) { %>
    <% _.each(items, function(item){ %>
      <% if (!item.opened) { %>
        <li class="u-flex NotificationsDropdown-item is-new CDB-Text CDB-Size-medium">
          <i class="u-hintTextColor u-flex u-alignCenter u-justifyCenter NotificationsDropdown-icon CDB-IconFont <%- item.iconFont %> <%- item.severity %>"></i>
          <p class="NotificationsDropdown-text u-altTextColor"><%= cdb.core.sanitize.html(item.msg) %></p>
        </li>
      <% } %>
    <% }) %>

    <% _.each(items, function(item){ %>
      <% if (item.opened) { %>
        <li class="u-flex NotificationsDropdown-item CDB-Text CDB-Size-medium">
          <i class="u-hintTextColor  u-flex u-alignCenter u-justifyCenter NotificationsDropdown-icon CDB-IconFont <%- item.iconFont %>"></i>
          <p class="NotificationsDropdown-text u-altTextColor"><%= cdb.core.sanitize.html(item.msg) %></p>
        </li>
      <% } %>
    <% }) %>

  <% } else { %>
    <li class="u-flex u-alignCenter NotificationsDropdown-item NotificationsDropdown-item--no-notifications CDB-Text CDB-Size-medium">
      <p class="NotificationsDropdown-text u-altTextColor">There are no notifications :)</p>
    </li>
  <% } %>
</ul>
