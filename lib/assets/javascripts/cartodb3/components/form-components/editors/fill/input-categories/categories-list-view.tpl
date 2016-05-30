<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
      <ul class="CDB-ColorBarContainer">
        <% _.each(categories, function (category) { %>
          <li class="CDB-ColorBar CDB-ColorBar--spaceless" style="background-color: <%- category.get('val') %>;"></li>
        <% }); %>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
