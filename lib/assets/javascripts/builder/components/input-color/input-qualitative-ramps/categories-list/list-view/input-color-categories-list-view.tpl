<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="u-flex u-justifySpace">
        <li class="u-flex">
          <button class="u-rSpace u-actionTextColor js-back">
            <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
          </button>
          <span class="label"> Color Schemes </span>
        </li>
      </ul>
    </li>
  </ul>
</div>

<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
      <ul class="ColorBarContainer">
        <% _.each(range, function (color) { %>
          <li class="ColorBar ColorBar--spaceless ColorBar--clickable js-color" style="background-color: <%- color %>;"></li>
          <% }); %>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
