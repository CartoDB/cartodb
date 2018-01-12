<p class="CDB-Text CDB-Size-large js-widget-title u-iBlock u-ellipsis u-rSpace"><%- title %></p>
<div class="CDB-Widget-contentSpaced--end">
  <div class="CDB-Widget-options CDB-Widget-contentSpaced">
    <p class="CDB-Text CDB-Size-small is-semibold u-upperCase u-rSpace--m js-val">…</p>

    <% if (showSelection && start && end) { %>
      <div class="CDB-Chart-staticTips">
        <div class="CDB-Chart-staticTip u-iBlock u-rSpace">
          <p class="CDB-Text CDB-Size-small CDB-Chart-staticTipText"><%= start %></p>
        </div>

        <p class="CDB-Text CDB-Size-small is-semibold u-upperCase u-iBlock u-rSpace">to</p>

        <div class="CDB-Chart-staticTip u-iBlock">
          <p class="CDB-Text CDB-Size-small CDB-Chart-staticTipText"><%= end %></p>
        </div>
      </div>
    <% } %>

    <% if (showClearButton) { %>
      <button class="CDB-Text CDB-Size-small is-semibold u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">Clear</button>
    <% } %>
    <button class="CDB-Shape CDB-Widget-actions js-actions u-lSpace" data-tooltip="More options">
      <div class="CDB-Shape-threePoints is-blue is-small">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </div>
    </button>
  </div>
</div>
