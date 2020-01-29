<% if (editable) { %>
  <a class="OrganizationList-userLink" href="<%- url %>">
<% } else { %>
  <span class="OrganizationList-userLink is-disabled">
<% } %>
  <div class="OrganizationList-userAvatar UserAvatar">
    <img src="<%- avatarUrl %>" alt="<%- username %>" src="<%- username %>" class="UserAvatar-img UserAvatar-img--medium-large OrganizationList-userAvatar--img" />
  </div>
    <div class="OrganizationList-userInfo">
      <div class="OrganizationList-userInfoName">
        <div class="u-flex u-alignCenter">
          <h3 class="CDB-Text u-ellipsLongText CDB-Size-medium is-semibold u-rSpace" title="<%- username %>"><%- username %></h3>
          <% if (isOwner) { %>
            <span class="UserRoleIndicator UserRoleIndicator--filled is-green u-lSpace">OWNER</span>
          <% } else if (isAdmin) { %>
            <span class="UserRoleIndicator UserRoleIndicator--filled is-grey u-lSpace">ADMIN</span>
          <% } %>
          <span class="UserRoleIndicator u-altTextColor u-lSpace u-upperCase">
            <%- role %>
          </span>
        </div>
        <h4 class="OrganizationList-userInfoSubtitle u-ellipsLongText" title="<%- user_email %>"><%- user_email %></h4>
      </div>
      <ul class="OrganizationList-userInfoData u-upperCase u-altTextColor">
        <li class="CDB-Text CDB-Size-small u-rSpace--xl u-flex u-alignCenter">
          <i class="CDB-IconFont CDB-IconFont-map CDB-Size-medium u-rSpace"></i>
          <span><%- maps_count %></span>
        </li>
        <li class="CDB-Text CDB-Size-small u-flex u-alignCenter">
          <i class="CDB-IconFont CDB-IconFont-rows CDB-Size-medium u-rSpace"></i>
          <span><%- table_count %></span>
        </li>
      </ul>
    </div>
<% if (editable) { %>
  </a>
<% } else { %>
  </span>
<% } %>
