<div class="MapCard <% if (isOwner) { %> MapCard--selectable <% } %>">
  <div class="MapCard-fake"></div>
  <a href="<%- url %>" class="MapCard-header js-header">
    <div class="MapCard-loader"></div>
    <div class="MapviewsGraph js-header-graph"></div>
  </a>
  <div class="MapCard-content">
    <div class="MapCard-contentBody">
      <div class="u-bSpace--xl MapCard-contentBodyRow--flex">
        <h3 class="MapCard-title DefaultTitle CDB-Text is-semibold CDB-Size-large u-ellipsLongText">
          <a class="DefaultTitle-link CDB-Text CDB-Size-large u-mainTextColor" title="<%- name %>" href="<%- url %>"><%- name %></a>
        </h3>
        <a href="<%- url %>" class="MapCard-editButton CDB-IconFont CDB-IconFont-pencil" title="<%- name %>"></a>
        <% if (showPermissionIndicator) { %>
          <span class="CDB-Text PermissionIndicator MapCard-itemTitlePermission">READ</span>
        <% } %>
      </div>

      <div class="u-bSpace--xl MapCard-contentBodyRow--flex">
        <div class="MapCard-desc js-item-description"></div>
      </div>

      <div class="MapCard-tags js-item-tags"></div>
    </div>
    <div class="MapCard-contentFooter CDB-Size-medium u-altTextColor">
      <div class="MapCard-contentFooterDetails--left">
        <button class="CDB-Tag CDB-Text CDB-Size-small is-semibold u-upperCase is-<%- privacy %> js-privacy"><%- privacy %></button>
        <div class="MapCard-contentFooterTimeDiff DefaultTimeDiff">
          <i class="CDB-IconFont CDB-IconFont-clock DefaultTimeDiff-icon"></i>
          <span class="CDB-Text CDB-Size-small u-altTextColor">
            <%- timeDiff %> <% if (!isOwner) { %>by<% } %>
          </span>
          <% if (!isOwner) { %>
            <span class="UserAvatar" data-tooltip="<%- owner.name || owner.username  %>">
              <img class="UserAvatar-img UserAvatar-img--smaller" src="<%- owner.avatar_url %>" />
            </span>
          <% } %>
        </div>
      </div>
      <div class="MapCard-contentFooterDetails--right">
        <span class="js-likes-indicator" />
      </div>
    </div>
  </div>
</div>
