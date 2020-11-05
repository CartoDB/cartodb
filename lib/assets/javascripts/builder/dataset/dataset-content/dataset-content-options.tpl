<div class="u-flex u-alignCenter">
  <div class="js-sync"></div>
  <div>
    <% if (entityTag && entity_type && entity_id) { %>
      <span class="Tag Tag--Entity u-ml--12 u-mr--8"><%- entityTag %></span>
      <a class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase" href="<%- baseUrl %>/dashboard/datasets/spatial-data-catalog/<%- entity_type %>/<%- entity_id %>"><%- entityLabel %></a>
    <% } %>
  </div>
</div>
<div class="js-dataset">
  <ul class="u-flex u-justifySpace">
    <% if (isEditable) { %>
      <li>
        <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase js-addRow">
          <div class="u-flex u-alignCenter">
            <svg width="16px" height="18px" viewBox="0 0 16 6" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                <path d="M4,3 L4,0 L3,0 L3,3 L0,3 L0,4 L3,4 L3,7 L4,7 L4,4 L7,4 L7,3 L4,3 Z" id="path-1"></path>
                <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="7" height="7" fill="white">
                    <use xlink:href="#path-1"></use>
                </mask>
              </defs>
              <g id="Add-Row" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <use id="Combined-Shape" stroke="#1181FB" mask="url(#mask-2)" stroke-width="2" xlink:href="#path-1"></use>
                <path d="M16,0 L16,3 L9,3 L9,0 L16,0 Z M10.0020142,1 L10.000989,2.01795972 L14.9926249,2.00301586 L14.9962966,1.00580263 L10.0020142,1 Z" id="Combined-Shape" fill="#1181FB"></path>
                <path d="M16,4 L16,7 L9,7 L9,4 L16,4 Z M10.0020142,5 L10.000989,6.01795972 L14.9926249,6.00301586 L14.9962966,5.00580263 L10.0020142,5 Z" id="Combined-Shape-Copy" fill="#1181FB"></path>
              </g>
            </svg>
            <span class="u-lSpace">
              <%- _t('dataset.options.add-row') %>
            </span>
          </div>
        </button>
      </li>
      <li class="u-lSpace--xl">
        <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase js-addColumn">
          <div class="u-flex u-alignCenter">
            <svg width="16px" height="18px" viewBox="0 4 16 6" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g id="Add-Column" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 4.000000)">
                <path d="M4,3 L4,0 L3,0 L3,3 L0,3 L0,4 L3,4 L3,7 L4,7 L4,4 L7,4 L7,3 L4,3 Z" id="Combined-Shape" fill="#1181FB"></path>
                <path d="M9,0 L12,0 L12,7 L9,7 L9,0 Z M10,1 L11,1 L11,6 L10,6 L10,1 Z" id="Combined-Shape" fill="#1181FB"></path>
                <path d="M13,0 L16,0 L16,7 L13,7 L13,0 Z M14,1 L15,1 L15,6 L14,6 L14,1 Z" id="Combined-Shape-Copy-2" fill="#1181FB"></path>
              </g>
            </svg>
            <span class="u-lSpace">
              <%- _t('dataset.options.add-column') %>
            </span>
          </div>
        </button>
      </li>
    <% } %>
    <li class="u-lSpace--xl">
      <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase is-disabled js-export">
        <div class="u-flex u-alignCenter">
          <svg width="11px" height="18px" viewBox="-1 2 11 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="Esport" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 3.000000)" stroke-linecap="square">
              <path d="M4.5,0.5 L4.5,6.5" id="Line" stroke="#1181FB"></path>
              <path d="M4.5,7.5 L8.5,3.5" id="Line" stroke="#1181FB"></path>
              <path d="M4.5,7.5 L0.5,3.5" id="Line" stroke="#1181FB"></path>
            </g>
          </svg>
          <span class="u-lSpace">
            <%- _t('dataset.options.export') %>
          </span>
        </div>
      </button>
    </li>
  </ul>
</div>
