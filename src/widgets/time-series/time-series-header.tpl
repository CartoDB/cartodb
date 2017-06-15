<div class="CDB-Widget-contentSpaced CDB-Widget-contentFull">

  <div class="CDB-Widget-contentSpaced--start">
    <% if (showSelection) { %>
      <p class="CDB-Text">
        Selected from
        <span class="u-secondaryTextColor"><%- start %></span>
        to
        <span class="u-secondaryTextColor"><%- end %></span>
      </p>
    <% } %>
  </div>
  <div class="CDB-Widget-contentSpaced--end">
    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
      <p class="CDB-Text CDB-Size-small is-semibold u-upperCase u-rSpace--m js-val">…</p>
      <% if (showClearButton) { %>
        <button class="CDB-Text CDB-Size-small is-semibold u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">Clear</button>
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
