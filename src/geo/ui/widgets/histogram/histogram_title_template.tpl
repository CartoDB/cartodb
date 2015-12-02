<h3 class="CDB-Widget-textBig" title="<%- title %>"><%- title %></h3>
<div class="CDB-Widget-options CDB-Widget-contentSpaced">
  <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-sizes
    <%- isSizesApplied ? 'is-selected' : '' %>
    <%- isSizesApplied ? 'js-cancelSizes' : 'js-applySizes' %>
    " data-tooltip="<%- isSizesApplied ? 'Remove sizes' : 'Apply sizes' %>">
    <i class="CDB-Icon CDB-Icon-syringe CDB-Icon--top"></i>
  </button>
  <button class="CDB-Shape-threePoints js-collapse" data-tooltip="<%- isCollapsed ? 'Show' : 'Hide' %>">
    <span class="CDB-Shape-threePointsItem"></span>
  </button>
</div>
