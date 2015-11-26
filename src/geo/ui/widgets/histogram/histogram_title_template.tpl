<h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>
<div class="Widget-options">
  <button class="Widget-buttonIcon Widget-buttonIcon--circle
    <%- isSizesApplied ? 'is-selected' : '' %>
    <%- isSizesApplied ? 'js-cancelSizes' : 'js-applySizes' %>
    ">
    <i class="CDBIcon CDBIcon-Syringe CDBIcon--top"></i>
  </button>
  <button class="Widget-arrow js-collapse <%- isCollapsed ? 'Widget-arrow--down' : 'Widget-arrow--up' %> "></button>
</div>
