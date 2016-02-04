<h3 class="CDB-Widget-textBig" title="<%- title %>"><%- title %></h3>
<div class="CDB-Widget-options CDB-Widget-contentSpaced">
  <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-sizes
    <%- isSizesApplied ? 'is-selected' : '' %>
    <%- isSizesApplied ? 'js-cancelSizes' : 'js-applySizes' %>
    " data-tooltip="<%- isSizesApplied ? 'Remove sizes' : 'Apply sizes' %>">
    <i class="CDB-IconFont CDB-IconFont-drop CDB-IconFont--small CDB-IconFont--top"></i>
  </button>
  <div class="CDB-Shape js-actions">
    <button class="CDB-Shape-threePoints is-blue is-small">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </button>
  </div>
</div>
