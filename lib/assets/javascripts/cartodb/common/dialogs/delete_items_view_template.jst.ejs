<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-trash"></i>
    <span class="Badge Badge--negative Dialog-headerIconBadge CDB-Text CDB-Size-small"><%- selectedCount %></span>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    <% if (selectedCount > 1) { %>
    You are about to delete <%- selectedCount %> <%- pluralizedContentType %>.
    <% } else { %>
    You are about to delete the <%- firstItemName %> <%- pluralizedContentType %>.
    <% } %>
  </h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (affectedVisCount > 0) { %>
      Doing so will imply changes in <strong><%- affectedVisCount %> affected <%- pluralizedMaps %></strong>.
    <% } %>
    The deleted <%- pluralizedContentType %> cannot be recovered, be sure before proceeding.
  </p>
  <% if (isDatasets) { %>
    <p class="CDB-Text CDB-Size-medium u-altTextColor">We recommend you to export your dataset before deleting it.</p>
  <% } %>
</div>

<% if (affectedVisCount > 0) { %>
  <ul class="Dialog-body MapsList MapsList--centerItems is-singleRow">
    <% visibleAffectedVis.forEach(function(vis) { %>
      <li class="MapsList-item MapsList-item--woTopBottomMargins">
        <div class="MapCard" data-vis-id="<%- vis.visId %>" data-vis-owner-name="<%- vis.ownerName %>" data-vis-auth-tokens="<%- vis.authTokens %>">
          <a href="<%- vis.url %>" target="_blank" class="MapCard-header MapCard-header--compact js-header">
            <div class="MapCard-loader"></div>
          </a>
          <div class="MapCard-content MapCard-content--compact">
            <div class="MapCard-contentBody">
              <div class="MapCard-contentBodyRow MapCard-contentBodyRow--flex">
                <h3 class="CDB-Text CDB-Size-medium u-bSpace u-ellipsis u-actionTextColor">
                  <a href="<%- vis.url %>" target="_blank" title="<%- vis.name %>"><%- vis.name %></a>
                </h3>
                <% if (vis.showPermissionIndicator) { %>
                  <span class="CDB-Text PermissionIndicator"></span>
                <% } %>
              </div>
              <p class="MapCard-contentBodyTimeDiff DefaultTimeDiff CDB-Text CDB-Size-small u-altTextColor">
                <%- vis.timeDiff %>
                <% if (!vis.isOwner) { %>
                  by <span class="UserAvatar">
                    <img class="UserAvatar-img UserAvatar-img--smaller" src="<%- vis.owner.get('avatar_url') %>" alt="<%- vis.owner.nameOrUsername()  %>" title="<%- vis.owner.nameOrUsername() %>" />
                  </span>
                <% } %>
              </p>
            </div>
          </div>
        </div>
      </li>
    <% }); %>
  </ul>
<% } %>

<% if (affectedEntitiesCount > 0) { %>
  <div class="Dialog-body Dialog-affectedEntities">
    <p class="DefaultParagraph CDB-Text CDB-Size u-altTextColor">Some users will lose access to your <%- pluralizedContentType %></p>
    <div class="u-flex">
      <% affectedEntitiesSample.forEach(function(user) { %>
        <span class="UserAvatar is-in-list">
          <% if (user.get('avatar_url')) { %>
            <img class="UserAvatar-img UserAvatar-img--medium" src="<%- user.get('avatar_url') %>" alt="<%- user.get('name') || user.get('username') %>" title="<%- user.get('name') || user.get('username') %>" />
          <% } else { %>
            <div class="UserAvatar-img UserAvatar-img--medium UserAvatar-img--no-src" title="<%- user.get('name') || user.get('username') %>"></div>
          <% } %>
        </span>
      <% }); %>
      <% if (affectedEntitiesCount > affectedEntitiesSampleCount) { %>
        <div class="UserAvatar is-in-list">
          <span class="UserAvatar-img UserAvatar-img--medium UserAvatar--moreItems" />
        </div>
      <% } %>
    </div>
  </div>
<% } %>

<div class="Dialog-footer Dialog-footer--simple u-inner">
  <div class="Dialog-footerContent MapsList-footer">
    <button class="CDB-Button CDB-Button--secondary cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Cancel</span>
    </button>
    <button class="u-lSpace--xl CDB-Button CDB-Button--error ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Ok, delete</span>
    </button>
  </div>
</div>
