<div class="CDB-Widget-contentSpaced CDB-Widget-contentFull">

  <div class="CDB-Widget-contentSpaced--start">
    <h3 class="CDB-Text CDB-Size-large u-ellipsis" title=""></h3>
    <% if (showSelection) { %>
      <div>
        <p class="CDB-Text CDB-Size-large u-iBlock">Selected from</p>
        <p class="CDB-Text CDB-Size-large u-secondaryTextColor u-iBlock"><%- start %></p>
        <p class="CDB-Text CDB-Size-large u-iBlock">to</p>
        <p class="CDB-Text CDB-Size-large u-secondaryTextColor u-iBlock"><%- end %></p>
      </div>
    <% } %>
  </div>
  <div class="CDB-Widget-contentSpaced--end">
    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
      <% if (showClearButton) { %>
        <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">Clear selection</button>
      <% } %>
      <button class="CDB-Shape CDB-Widget-actions js-actions u-lSpace">
        <div class="CDB-Shape-threePoints is-blue is-small">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </div>
      </button>
    </div>
  </div>
</div>
