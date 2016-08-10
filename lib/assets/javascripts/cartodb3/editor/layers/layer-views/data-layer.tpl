<% if (!isTorque) { %>
  <div class="Editor-ListLayer-dragIcon">
    <div class="CDB-Shape">
      <div class="CDB-Shape-rectsHandle is-small">
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-first"></div>
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-second"></div>
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-third"></div>
      </div>
    </div>
  </div>
<% } %>
<div class="Editor-ListLayer-itemHeader">
  <div class="Editor-ListLayer-media u-rSpace--m js-thumbnail" style="background: <%- color %>; color: #fff">
  </div>
  <div class="Editor-ListLayer-inner">
    <div class="Editor-ListLayer-title">
      <div class="Editor-ListLayer-titleText js-header"></div>
      <ul class="Editor-HeaderInfo-actions">
        <% if (isTorque) { %>
          <li class="Editor-HeaderInfo-actionsItem u-rSpace">
            <% if (isAnimated) { %>
              <svg width="19px" height="8px" viewBox="222 24 19 8" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <g id="Animated-Icon" opacity="0.6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(222.000000, 24.000000)">
                  <rect id="Rectangle-649" fill="#2E3C43" x="11" y="0" width="8" height="8" rx="4"></rect>
                  <rect id="Rectangle-649" fill="#2E3C43" opacity="0.5" x="5" y="0" width="8" height="8" rx="4"></rect>
                  <rect id="Rectangle-649" fill="#2E3C43" opacity="0.2" x="0" y="0" width="8" height="8" rx="4"></rect>
                </g>
              </svg>
            <% } else { %>
              <svg width="31px" height="17px" viewBox="674 512 31 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <g id="Group-5" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(674.000000, 512.000000)">
                  <ellipse id="Oval-120" fill="#E6E8E8" transform="translate(27.020000, 12.197917) rotate(-90.000000) translate(-27.020000, -12.197917) " cx="27.02" cy="12.1979167" rx="3.875" ry="3.84"></ellipse>
                  <ellipse id="Oval-120-Copy" fill="#C0C4C7" transform="translate(26.700000, 11.875000) rotate(-90.000000) translate(-26.700000, -11.875000) " cx="26.7" cy="11.875" rx="2.60486111" ry="2.58133333"></ellipse>
                  <path d="M26.93,13.0729167 C27.3442136,13.0729167 27.68,12.7371302 27.68,12.3229167 C27.68,11.9087031 27.3442136,11.5729167 26.93,11.5729167 C26.5157864,11.5729167 26.18,11.9087031 26.18,12.3229167 C26.18,12.7371302 26.5157864,13.0729167 26.93,13.0729167 Z" id="Oval-120-Copy-2" fill="#828A8F" opacity="0.8" transform="translate(26.930000, 12.322917) rotate(-90.000000) translate(-26.930000, -12.322917) "></path>
                  <ellipse id="Oval-120" fill="#E6E8E8" transform="translate(8.140000, 8.000000) rotate(-90.000000) translate(-8.140000, -8.000000) " cx="8.14" cy="8" rx="7.75" ry="7.68"></ellipse>
                  <ellipse id="Oval-120-Copy" fill="#C0C4C7" transform="translate(8.140000, 8.000000) rotate(-90.000000) translate(-8.140000, -8.000000) " cx="8.14" cy="8" rx="5.68333333" ry="5.632"></ellipse>
                  <path d="M7.96,10.75 C9.34071187,10.75 10.46,9.63071187 10.46,8.25 C10.46,6.86928813 9.34071187,5.75 7.96,5.75 C6.57928813,5.75 5.46,6.86928813 5.46,8.25 C5.46,9.63071187 6.57928813,10.75 7.96,10.75 Z" id="Oval-120-Copy-2" fill="#828A8F" transform="translate(7.960000, 8.250000) rotate(-90.000000) translate(-7.960000, -8.250000) "></path>
                  <path d="M16.1403347,6.71285923 C16.4606435,9.05621552 18.487459,10.8625 20.94,10.8625 C23.6151293,10.8625 25.78375,8.7134668 25.78375,6.0625 C25.78375,3.4115332 23.6151293,1.2625 20.94,1.2625 C18.2648707,1.2625 16.09625,3.4115332 16.09625,6.0625 C16.09625,6.28307774 16.1112641,6.50018043 16.1403347,6.71285923 Z" id="Oval-120" fill="#E6E8E8" transform="translate(20.940000, 6.062500) rotate(-90.000000) translate(-20.940000, -6.062500) "></path>
                  <ellipse id="Oval-120-Copy" fill="#C0C4C7" transform="translate(20.940000, 6.062500) rotate(-90.000000) translate(-20.940000, -6.062500) " cx="20.94" cy="6.0625" rx="3.55208333" ry="3.52"></ellipse>
                  <path d="M20.64,7.90625 C21.4684271,7.90625 22.14,7.23467712 22.14,6.40625 C22.14,5.57782288 21.4684271,4.90625 20.64,4.90625 C19.8115729,4.90625 19.14,5.57782288 19.14,6.40625 C19.14,7.23467712 19.8115729,7.90625 20.64,7.90625 Z" id="Oval-120-Copy-2" fill="#828A8F" opacity="0.8" transform="translate(20.640000, 6.406250) rotate(-90.000000) translate(-20.640000, -6.406250) "></path>
                  <path d="M13.5625,2.88 C13.5625,2.88 16.1458333,5.12 18.0833333,2.56 C17.4375,4.16 17.1145833,5.44 17.1145833,5.44 L16.46875,6.72 L14.2083333,4.8 L13.5625,2.88 Z" id="Path-494" fill="#E6E8E8"></path>
                  <path d="M23.3894032,6.40571996 C23.3894032,6.40571996 25.9727365,8.64571996 27.9102365,6.08571996 C27.2644032,7.68571996 26.9414865,8.96571996 26.9414865,8.96571996 L26.2956532,10.24572 L24.0352365,8.32571996 L23.3894032,6.40571996 Z" id="Path-494" fill="#E6E8E8" transform="translate(25.649820, 8.165720) rotate(52.000000) translate(-25.649820, -8.165720) "></path>
                  <path d="M20.6462245,8.51753488 C20.6462245,8.51753488 23.9604656,11.3038091 25.8979656,8.74380905 C25.2521323,10.3438091 25.078218,11.598674 25.078218,11.598674 L24.4323847,12.878674 L21.1028976,9.87517984 L20.6462245,8.51753488 Z" id="Path-494" fill="#E6E8E8" transform="translate(23.272095, 10.698104) rotate(-135.000000) translate(-23.272095, -10.698104) "></path>
                  <path d="M18.2927779,9.85808612 C18.2927779,9.85808612 15.6067281,8.91370489 14.3461002,11.8663856 C14.5856745,10.1576712 14.5893391,8.83757209 14.5893391,8.83757209 L14.4253034,7.30493626 L14.7514729,5.70339822 L18.2927779,9.85808612" id="Path-494" fill="#E6E8E8"></path>
                  <path d="M13.5625,7.36 C13.4675345,6.32481472 11.9479167,4.16 11.9479167,4.16 C11.9479167,4.16 13.8854167,5.76 15.5,5.76 C17.1145833,5.76 19.0520833,3.2 19.0520833,3.2 C19.0520833,3.2 17.7604167,5.28322917 17.7604167,6.4 C17.7604167,7.20322917 19.0520833,8.96 19.0520833,8.96 C19.0520833,8.96 17.4375,7.68 15.8229167,7.68 C14.2083333,7.68 12.59375,11.2 12.59375,11.2 C12.59375,11.2 13.6828123,8.67148139 13.5625,7.36 Z" id="Path-497" fill="#C0C4C7"></path>
                  <path d="M22.4640322,8.76168028 C22.4035996,7.726495 20.5158361,6.03507328 20.5158361,6.03507328 C20.5158361,6.03507328 22.7388931,7.85901243 23.7663552,7.85901243 C24.7938174,7.85901243 26.7741061,6.25901243 26.7741061,6.25901243 C26.7741061,6.25901243 25.4937634,7.96018563 25.4937634,9.07695646 C25.4937634,9.88018563 26.3684576,10.5663418 26.3684576,10.5663418 C26.3684576,10.5663418 24.9993098,9.77901243 23.9718477,9.77901243 C22.9443855,9.77901243 21.2949985,12.3235248 21.2949985,12.3235248 C21.2949985,12.3235248 22.5405945,10.0731617 22.4640322,8.76168028 Z" id="Path-497" fill="#C0C4C7" transform="translate(23.644971, 9.179299) rotate(52.000000) translate(-23.644971, -9.179299) "></path>
                  <path d="" id="Path-499" stroke="#979797" stroke-width="0.64"></path>
                  <polygon id="Path-500" fill="#828A8F" points="9.94618849 9.56 11.6875 7.72609277 9.6875 6.56"></polygon>
                </g>
              </svg>
            <% } %>
          </li>
        <% } %>
        <li class="Editor-HeaderInfo-actionsItem CDB-Shape">
          <button class="js-toggle">
            <% if (isVisible) { %>
              <i class="CDB-IconFont CDB-IconFont-view u-actionTextColor"></i>
            <% } else { %>
              <i class="CDB-IconFont CDB-IconFont-hide u-actionTextColor"></i>
            <% } %>
          </button>
        </li>
        <li class="Editor-HeaderInfo-actionsItem CDB-Shape">
          <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
          </button>
        </li>
      </ul>
    </div>
    <div class="u-flex u-justifySpace">
      <button class="CDB-Text CDB-Size-small u-actionTextColor u-upperCase js-add-analysis" data-layer-id="<%- layerId %>">
        <%- _t('editor.layers.layer.add-analysis') %>
      </button>
      <% if (isCollapsed && numberOfAnalyses > 0) { %>
        <p class="CDB-Text CDB-Size-small u-secondaryTextColor">
          <%- _t('editor.layers.layer.analyses-count', { smart_count: numberOfAnalyses }) %>
        </p>
      <% } %>
    </div>
  </div>
</div>
<ul class="Editor-ListAnalysis js-analyses <%- isCollapsed ? 'is-hidden' : '' %>"></ul>
