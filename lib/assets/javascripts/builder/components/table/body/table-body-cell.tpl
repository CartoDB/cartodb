<td class="Table-cellItem" data-attribute="<%- columnName %>" title="<%- value %>" data-clipboard-text='<%- value %>'>
  <div class="
      Table-cell u-flex u-justifySpace
      <%- columnName === 'cartodb_id' || (type === 'geometry' && geometry !== 'point') ? 'Table-cell--short' : '' %>
    ">
    <!--
      WARNING: .fs-hide class excludes this element, which might
      contain sensitive data, from FullStory recordings.
      Do not remove it unless we are no longer using FullStory!

      More info:
        https://help.fullstory.com/technical-questions/exclude-elements
    -->
    <p class="
      fs-hide
      CDB-Text CDB-Size-medium
      u-ellipsis u-rSpace--xl
      <%- type === 'number' && columnName !== 'cartodb_id' ? 'is-number' : '' %>
      <%- value === null ? 'is-null' : '' %>
      <%- columnName === 'cartodb_id' ? 'is-cartodbId' : '' %>
      js-value
    ">
      <%- value === null ? 'null' : formattedValue %>
    </p>

    <% if (columnName !== 'cartodb_id') { %>
      <button class="CDB-Shape-threePoints is-blue is-small Table-cellItemOptions js-cellOptions">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </button>
    <% } %>
  </div>
</td>
