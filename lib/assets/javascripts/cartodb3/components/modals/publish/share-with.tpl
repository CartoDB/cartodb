<% if (people > 0) { %>
<img class="Share-user <%- avatarClass %> u-rSpace u-iBlock" src="<%- avatar %>">
<span class="u-secondaryTextColor CDB-Text CDB-Size-small <%- separationClass %>">+ <%- people %></span>
<% } else { %>
  <% if (hasAction) { %>
  <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor js-action <%- separationClass %>"><%- _t('components.modals.publish.share.add-people') %></button>
  <% } %>
<% } %>
