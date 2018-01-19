<div class="Editor-HeaderInfo-inner">
  <div class="Editor-HeaderInfo-title u-bSpace--m u-flex u-alignCenter">
    <% if (isSync && isOwner) { %>
      <div class="Editor-HeaderInfo-actions">
        <span class="SyncInfo-state SyncInfo-state--<%- syncState %> u-rSpace--m js-syncState"></span>
      </div>
    <% } %>

    <div class="Editor-HeaderInfo-titleText is-larger js-name">
      <h2 class="u-ellipsis CDB-Text CDB-Size-huge is-light"><%- title %></h2>
    </div>

    <div class="Editor-HeaderInfo-details u-lSpace">
      <% if (!hasWriteAccess) { %>
        <span class="Tag CDB-Text CDB-Size-small u-rSpace u-upperCase js-readPermissionTag"><%- _t('dataset.read') %></span>
      <% } %>

      <% if (isCustomQueryApplied) { %>
        <span class="Tag Tag--outline Tag-outline--dark CDB-Text CDB-Size-small u-secondaryTextColor u-rSpace"><%- _t('dataset.sql') %></span>
      <% } %>

      <button class="CDB-Shape js-options">
        <div class="CDB-Shape-threePoints is-blue is-small">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </div>
      </button>
    </div>
  </div>

  <div class="u-bSpace--xl u-flex u-alignCenter">
    <div class="js-dropdown u-rSpace--m"></div>
    <% if (isOwner && isInsideOrg) { %>
      <div class="js-share-users"></div>
    <% } %>
    <span class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('dataset.updated', { ago: ago }) %></span>
  </div>
</div>
