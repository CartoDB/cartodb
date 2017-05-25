<div class="CDB-Widget-title CDB-Widget-contentSpaced">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">

    <h3 class="CDB-Text CDB-Size-large u-ellipsis" title=""></h3>

    <% if (showSelection) { %>
      <div>
        <p class="CDB-Text CDB-Size-large u-iBlock">Selected from</p>
        <p class="CDB-Text CDB-Size-large u-secondaryTextColor u-iBlock"><%- start %></p>
        <p class="CDB-Text CDB-Size-large u-iBlock">to</p>
        <p class="CDB-Text CDB-Size-large u-secondaryTextColor u-iBlock"><%- end %></p>
      </div>
    <% } %>

    <% if (showClearButton) { %>
      <div>
        <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">Clear selection</button>
      </div>
    <% } %>

    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
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
