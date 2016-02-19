<div class="CDB-Widget-header js-header">
  <div class="js-title">
    <div class="CDB-Widget-title CDB-Widget-contentSpaced">
      <h3 class="CDB-Text CDB-Size-large is-overflow" title="<%- title %>"><%- title %></h3>
      <div class="CDB-Widget-options CDB-Widget-contentSpaced">
        <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-sizes
          <%- isSizesApplied ? 'is-selected' : '' %>
          <%- isSizesApplied ? 'js-cancelSizes' : 'js-applySizes' %>
          " data-tooltip="<%- isSizesApplied ? 'Remove sizes' : 'Apply sizes' %>">
          <i class="CDB-IconFont CDB-IconFont-drop CDB-IconFont--small CDB-IconFont--top"></i>
        </button>
        <button class="CDB-Shape js-actions u-lSpace">
          <div class="CDB-Shape-threePoints is-blue is-small">
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
          </div>
        </button>
      </div>

    </div>
  </div>
  <% if (showStats) { %>
    <dl class="CDB-Widget-info CDB-Text CDB-Size-small u-secondaryTextColor u-upperCase">
      <dt class="CDB-Widget-infoCount js-nulls">0</dt><dd class="CDB-Widget-infoDescription">NULL ROWS</dd>
      <dt class="CDB-Widget-infoCount js-min">0</dt><dd class="CDB-Widget-infoDescription">MIN</dd>
      <dt class="CDB-Widget-infoCount js-avg">0</dt><dd class="CDB-Widget-infoDescription">AVG</dd>
      <dt class="CDB-Widget-infoCount js-max">0</dt><dd class="CDB-Widget-infoDescription">MAX</dd>
    </dl>
  <% } %>
</div>
<div class="CDB-Widget-content CDB-Widget-content--histogram js-content">
  <div class="CDB-Widget-tooltip CDB-Widget-tooltip--light CDB-Text CDB-Size-small js-tooltip"></div>
  <div class="CDB-Widget-filter CDB-Widget-contentSpaced ">
    <p class="CDB-Text CDB-Size-small is-semibold u-upperCase js-val">…</p>
    <div class="CDB-Widget-filterButtons js-filter is-hidden">
      <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-zoom">zoom</button>
      <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">clear</button>
    </div>
  </div>
</div>
