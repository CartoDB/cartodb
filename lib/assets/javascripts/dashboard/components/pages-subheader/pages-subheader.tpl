<div class="SideMenu-type">
  <ul class="SideMenu-list">
    <li class="SideMenu-typeItem"><a href="<%= profileUrl %>" class="SideMenu-typeLink <% if (path === profileUrl) { %>is-selected<% } %>">Profile</a></li>
    <li class="SideMenu-typeItem"><a href="<%= accountUrl %>" class="SideMenu-typeLink <% if (path === accountUrl) { %>is-selected<% } %>">Account</a></li>
    <li class="SideMenu-typeItem"><a href="<%= connectedAppsUrl %>" class="SideMenu-typeLink <% if (path === connectedAppsUrl) { %>is-selected<% } %>">Connected Apps</a></li>
    <% if (!isCartoDBHosted && !isInsideOrg) { %>
      <li class="SideMenu-typeItem"><a href="<%= planUrl %>" class="SideMenu-typeLink">Billing</a></li>
    <% } %>
    <% if (isOrgAdmin) { %>
      <li class="SideMenu-typeItem"><a href="<%= organizationUrl %>" class="SideMenu-typeLink <% if (path === organizationUrl) { %>is-selected<% } %>">Organization settings</a></li>
    <% } %>

    <span class="SideMenu-separator"></span>

    <li class="SideMenu-typeItem"><a href="<%= apiKeysUrl %>" class="SideMenu-typeLink <% if (path === apiKeysUrl) { %>is-selected<% } %>">Developer Settings</a></li>
  </ul>
</div>

