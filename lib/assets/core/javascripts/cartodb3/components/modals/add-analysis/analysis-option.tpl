<div class="Analysis-animation <% if (enabled) { %>is-enabled<% } %> <% if (type) { %>is-<%- type %><% } %> js-animation u-flex u-alignCenter u-justifyCenter"></div>
<div class="Analysis-info u-flex">
  <div class="ModalBlockList-itemInput CDB-Size-large">
    <input class="CDB-Radio" type="radio" value="true"
        <% if (selected) { %>checked="checked"<% } %>
        <% if (!enabled) { %>disabled="disabled"<% } %>
      >
    <span class="u-iBlock CDB-Radio-face"></span>
  </div>
  <div class="ModalBlockList-inner">
    <div class="ModalBlockList-item-header u-bSpace">
      <h2 class="ModalBlockList-item-headerTitle CDB-Text CDB-Size-large u-rSpace--m u-ellipsis" title="<%- title %>">
        <%- title %>
      </h2>
    </div>
    <div class="ModalBlockList-item-body">
      <p class="CDB-Text CDB-Size-small u-secondaryTextColor">
        <%- desc %>
      </p>
      <% if (link) { %>
      <a class="Analysis-link CDB-Text CDB-Size-small u-tSpace-xl u-actionTextColor u-upperCase js-more track-<%- type %>-modal-learn" href="<%- link %>" target="_blank">
        <%- _t('components.modals.add-analysis.more-info') %>
      </a>
      <% } %>
    </div>
  </div>
</div>
