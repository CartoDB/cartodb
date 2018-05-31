<div class="DatasetsList-fake"></div>
<div class="DatasetsList-itemCategory is--<%- isRaster ? 'raster' : geometryType %>Dataset">
  <% if (syncStatus) { %>
    <i
    <% if (syncStatus === "failure") { %>
      data-tooltip="Sync failed, last attempt was <%- syncRanAt %>"
    <% } else if (syncStatus === "syncing") { %>
      data-tooltip="Syncing"
    <% } else { %>
      data-tooltip="Synced <%- syncRanAt %>"
    <% } %>
    class="CDB-IconFont CDB-IconFont-wifi DatasetsList-itemStatus is-<%- syncStatus %> js-syncInfo <% if (!fromExternalSource) { %>js-sync<% } %>"></i>
  <% } %>
  <% if (fromExternalSource) { %>
    <i data-tooltip="Public dataset" class="CDB-IconFont CDB-IconFont-book DatasetsList-itemStatus DatasetsList-aditionalItemStatus js-public is-public"></i>
  <% } %>
</div>
<div class="DatasetsList-itemInfo">
  <div class="DatasetsList-itemPrimaryInfo">
    <h3 class="DatasetsList-itemTitle">
      <% if (isRaster) { %>
        <p title="<%- title %>" class="DatasetsList-itemTitle CDB-Text CDB-Size-large is-disabled u-ellipsLongText"><%- title %></p>
      <% } else { %>
        <a href="<%- datasetUrl %>" title="<%- title %>" class="u-ellipsis CDB-Text CDB-Size-large u-mainTextColor"><%- title %></a>
      <% } %>
      <% if (showPermissionIndicator) { %>
        <span class="CDB-Text DatasetsList-itemTitlePermission PermissionIndicator">READ</span>
      <% } %>
    </h3>
    <div class="DatasetsList-itemDescription js-item-description"></div>
  </div>
  <div class="DatasetsList-itemSecondaryInfo">
    <ul class="DatasetsList-itemMeta CDB-Text CDB-Size-small u-secondaryTextColor">
      <li>
        <button class="CDB-Tag CDB-Text CDB-Size-small is-semibold u-upperCase is-<%- privacy %> js-privacy"><%- privacy %></button>
      </li>
      <% if (datasetSize) { %>
        <li class="js-sizeIndicator">
          <%- datasetSize %>
        </li>
      <% } %>
      <li>
        <span class="js-likes-indicator"></span>
      </li>
      <% if (rowCount) { %>
        <li>
          <%- rowCount %> <%- pluralizedRows %>
        </li>
      <% } %>
      <li class="u-flex u-alignCenter">
          <%- timeDiff %>
          <% if (!isOwner) { %>
            by
            <span class="UserAvatar u-lSpace" data-tooltip="<%- owner.name || owner.username  %>">
              <img class="UserAvatar-img UserAvatar-img--smaller" src="<%- owner.avatar_url %>" />
            </span>
          <% } %>
      </li>

    </ul>
    <div class="DatasetsList-itemMeta DatasetsList-itemTags js-item-tags">
    </div>
  </div>
</div>
