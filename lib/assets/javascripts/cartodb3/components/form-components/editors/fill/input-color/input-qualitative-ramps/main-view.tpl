<div class="CDB-Box-modalHeader js-prevStep">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="u-flex u-justifySpace">
        <li class="u-flex">
          <button class="u-rSpace u-actionTextColor js-back">
            <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
          </button>
          <span class="label js-label"><%- attribute %></span>
        </li>
        <% if ((columnType !== 'number') && !hideQuantification) { %>
          <li class="u-flex">
            <%- _t('form-components.editors.fill.quantification.methods.' + quantification) %>
            <button class="CDB-Shape u-lSpace js-quantification">
              <div class="CDB-Shape-threePoints is-horizontal <% if (columnType !== 'string') { %>is-blue<% } %> is-small">
                <div class="CDB-Shape-threePointsItem"></div>
                <div class="CDB-Shape-threePointsItem"></div>
                <div class="CDB-Shape-threePointsItem"></div>
              </div>
            </button>
          </li>
        <% } %>
      </ul>
    </li>
  </ul>
</div>

<% if (status === 'loading') { %>
  <div class="InputColorCategory-loader js-loader">
    <div class="CDB-LoaderIcon is-dark">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  </div>
<% } else if (status === 'error') { %>
  <div class="u-flex u-alignCenter u-justifyCenter CDB-Text CDB-Size-medium u-bSpace--m u-tSpace--m u-errorTextColor"><%- _t('form-components.editors.fill.error') %></div>
<% } else { %>

  <!-- Stack Layout View -->
  <div class="js-content"></div>

<% } %>
