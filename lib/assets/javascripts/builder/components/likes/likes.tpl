<i class="CDB-IconFont CDB-IconFont-heartFill LikesIndicator-icon <% if ((typeof size != "undefined") && size === 'big') { %>LikesIndicator-icon--big Navmenu-icon<% } %>"></i>
<% if (likes > 2 || show_count) { %>
  <span class="CDB-Text CDB-Size-medium LikesIndicator-count"><%- likes %></span>
  <% if (show_label && likes > 3) { %>
    <span class="CDB-Text CDB-Size-medium LikesIndicator-label"><%- _t('components.likes-pluralize', { smart_count: likes }) %></span>
  <% } %>
<% } %>
