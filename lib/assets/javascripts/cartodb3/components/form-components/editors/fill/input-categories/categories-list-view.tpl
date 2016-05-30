<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
    <% if (isCustomizable) { %>
      <button class="u-rSpace--xl u-actionTextColor js-back">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <% } %>
      <ul class="CDB-ColorBarContainer">
        <% _.each(categories, function (category) { %>
          <li class="CDB-ColorBar CDB-ColorBar--spaceless" style="background-color: <%- category.get('val') %>;"></li>
        <% }); %>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
