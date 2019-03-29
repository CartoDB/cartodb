<div class="PreviewMap-canvas">
  <div class="PreviewMap-map js-map"></div>
  <div class="PreviewMap-info u-flex u-justifySpace u-alignCenter js-info">
    <div class="PreviewMap-infoName u-flex u-alignCenter">
      <% if (isSync && isOwner) { %>
        <span class="SyncInfo-state SyncInfo-state--<%- syncState %> u-rSpace--m js-syncState"></span>
      <% } %>
      <h2 class="u-ellipsis CDB-Text CDB-Size-large u-rSpace--m is-light"><%- name %></h2>
      <% if (isCustomQueryApplied) { %>
        <span class="CDB-Tag CDB-Tag--opaque u-secondaryTextColor CDB-Text CDB-Size-medium u-upperCase"><%- _t('dataset.sql') %></span>
      <% } %>
    </div>
    <div class="PreviewMap-infoActions">
      <button class="u-upperCase CDB-Text CDB-Size-small u-lSpace--xl u-actionTextColor js-back">
        <%- _t('dataset.preview-map.back') %>
      </button>
      <% if (canCreateMap) { %>
        <button class="CDB-Button CDB-Button--primary u-upperCase u-lSpace--xl js-createMap">
          <span class="CDB-Button-Text CDB-Text CDB-Size-small"><%- _t('dataset.create-map.title') %></span>
        </button>
      <% } %>
    </div>
  </div>
</div>
