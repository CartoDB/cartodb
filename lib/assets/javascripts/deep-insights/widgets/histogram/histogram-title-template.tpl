<div class="CDB-Widget-title CDB-Widget-contentSpaced">
  <h3 class="CDB-Text CDB-Size-large u-ellipsis" title="<%- title %>"><%- title %></h3>
  <div class="CDB-Widget-options CDB-Widget-contentSpaced">
    <% if (isAutoStyleEnabled) { %>
      <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-sizes
        <%- isAutoStyle ? 'is-selected' : '' %>
        <%- isAutoStyle ? 'js-cancelAutoStyle' : 'js-autoStyle' %>
        " data-tooltip="<%- isAutoStyle ? 'Remove Auto style' : 'Apply Auto Style' %>">
        <i class="CDB-IconFont CDB-IconFont-drop CDB-IconFont--small CDB-IconFont--top"></i>
      </button>
    <% } %>
    <button class="CDB-Shape CDB-Widget-actions js-actions u-lSpace" data-tooltip="<%= _t('deep_insights.widgets.tooltip') %>">
      <div class="CDB-Shape-threePoints is-blue is-small">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </div>
    </button>
  </div>
</div>
