<div class="js-sync"></div>
<div class="js-dataset">
  <ul class="u-flex u-justifySpace">
    <% if (isEditable) { %>
      <li>
        <button class="u-flex u-alignCenter  CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase js-addRow">
          <svg width="16px" height="7px" viewBox="563 478 16 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                  <rect id="path-1" x="3" y="0" width="1" height="7"></rect>
                  <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="1" height="7" fill="white">
                      <use xlink:href="#path-1"></use>
                  </mask>
                  <rect id="path-3" x="0" y="3" width="7" height="1"></rect>
                  <mask id="mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="7" height="1" fill="white">
                      <use xlink:href="#path-3"></use>
                  </mask>
                  <rect id="path-5" x="9" y="0" width="7" height="3"></rect>
                  <mask id="mask-6" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="7" height="3" fill="white">
                      <use xlink:href="#path-5"></use>
                  </mask>
                  <rect id="path-7" x="9" y="4" width="7" height="3"></rect>
                  <mask id="mask-8" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="7" height="3" fill="white">
                      <use xlink:href="#path-7"></use>
                  </mask>
              </defs>
              <g id="Add-Row" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(563.000000, 478.000000)">
                  <use id="Rectangle-1416" stroke="#1181FB" mask="url(#mask-2)" stroke-width="2" xlink:href="#path-1"></use>
                  <use id="Rectangle-1417" stroke="#1181FB" mask="url(#mask-4)" stroke-width="2" xlink:href="#path-3"></use>
                  <use id="Rectangle-1418" stroke="#1181FB" mask="url(#mask-6)" stroke-width="2" xlink:href="#path-5"></use>
                  <use id="Rectangle-1418" stroke="#1181FB" mask="url(#mask-8)" stroke-width="2" xlink:href="#path-7"></use>
              </g>
          </svg>
          <span class="u-lSpace">
            <%- _t('dataset.options.add-row') %>
          </span>
        </button>
      </li>
      <li class="u-lSpace--xl">
        <button class="u-flex u-alignCenter CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase js-addColumn">
          <svg width="16px" height="7px" viewBox="0 0 16 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                  <rect id="path-1" x="3" y="0" width="1" height="7"></rect>
                  <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="1" height="7" fill="white">
                      <use xlink:href="#path-1"></use>
                  </mask>
                  <rect id="path-3" x="0" y="3" width="7" height="1"></rect>
                  <mask id="mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="7" height="1" fill="white">
                      <use xlink:href="#path-3"></use>
                  </mask>
                  <rect id="path-5" x="9" y="0" width="3" height="7"></rect>
                  <mask id="mask-6" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="3" height="7" fill="white">
                      <use xlink:href="#path-5"></use>
                  </mask>
                  <rect id="path-7" x="13" y="0" width="3" height="7"></rect>
                  <mask id="mask-8" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="3" height="7" fill="white">
                      <use xlink:href="#path-7"></use>
                  </mask>
              </defs>
              <g id="Add-Column" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                  <use id="Rectangle-1416" stroke="#1181FB" mask="url(#mask-2)" stroke-width="2" xlink:href="#path-1"></use>
                  <use id="Rectangle-1417" stroke="#1181FB" mask="url(#mask-4)" stroke-width="2" xlink:href="#path-3"></use>
                  <use id="Rectangle-1418" stroke="#1181FB" mask="url(#mask-6)" stroke-width="2" xlink:href="#path-5"></use>
                  <use id="Rectangle-1418" stroke="#1181FB" mask="url(#mask-8)" stroke-width="2" xlink:href="#path-7"></use>
              </g>
          </svg>
          <span class="u-lSpace">
            <%- _t('dataset.options.add-column') %>
          </span>
        </button>
      </li>
    <% } %>
    <li class="u-lSpace--xl">
      <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase is-disabled u-flex u-alignCenter js-export">
        <svg width="10px" height="9px" viewBox="760 477 10 9" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="arrow" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(760.000000, 477.000000)">
                <path d="M0.707106781,3 L0.707106781,3 L5.35355339,7.64644661 L4.64644661,8.35355339 L9.53903623e-13,3.70710678 L0.707106781,3 Z M8.34664192,3 L9.0537487,3.70710678 L4.40730209,8.35355339 L3.70019531,7.64644661 L8.34664192,3 L8.34664192,3 Z" fill="#1181FB"></path>
                <rect id="Rectangle-9" fill="#1181FB" x="4" y="0" width="1" height="8"></rect>
            </g>
        </svg>
        <span class="u-lSpace">
          <%- _t('dataset.options.export') %>
        </span>
      </button>
    </li>
  </ul>
</div>
