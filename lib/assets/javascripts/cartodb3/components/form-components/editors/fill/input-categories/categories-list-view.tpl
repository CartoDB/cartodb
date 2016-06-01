<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
      <button class="u-rSpace--xl u-actionTextColor js-back">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <%- attribute %>
    </li>
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
      <ul class="CDB-ColorBarContainer">
        <% _.each(range, function (color) { %>
          <li class="CDB-ColorBar CDB-ColorBar--spaceless" style="background-color: <%- color %>;"></li>
        <% }); %>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
