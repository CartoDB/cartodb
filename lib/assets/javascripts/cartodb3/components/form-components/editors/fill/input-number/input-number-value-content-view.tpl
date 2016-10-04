<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="u-flex u-justifySpace">
        <li class="u-flex">
          <button class="u-actionTextColor js-back u-rSpace">
            <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
          </button>
          <%- attribute %>
        </li>
        <li class="u-flex">
          <%- _t('form-components.editors.fill.quantification.methods.' + quantification) %>
          <button class="CDB-Shape u-lSpace js-quantification">
            <div class="CDB-Shape-threePoints is-horizontal is-blue is-small">
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
            </div>
          </button>
        </li>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
