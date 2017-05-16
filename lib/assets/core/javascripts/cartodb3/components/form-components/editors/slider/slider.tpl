<li class="CDB-OptionInput-item CDB-OptionInput-item--noSeparator">
  <% if (direction === 'desc') { %>
  <svg class="UISlider-scale" width="160px" height="7px" viewBox="0 0 160 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <g fill="#EEEEEE">
        <path d="M0,3.96972188 C0,2.86143684 0.899814069,1.95171147 1.99402962,1.93799103 L158.00597,-0.0182528125 C159.107243,-0.0320617354 160,0.846465216 160,1.95103649 L160,4.98745286 C160,6.08887023 159.100186,6.96483876 158.00597,6.94427947 L1.99402962,4.012961 C0.89275747,3.99226913 0,3.08692473 0,1.96876746 L0,3.96972188 Z" id="Mask" transform="translate(80.000000, 3.458568) scale(-1, 1) translate(-80.000000, -3.458568) "></path>
      </g>
    </g>
  </svg>
  <% } else if (direction === 'asc') { %>
  <svg class="UISlider-scale" width="160px" height="7px" viewBox="0 0 160 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <g transform="translate(80.000000, 4.000000) rotate(-180.000000) translate(-80.000000, -4.000000) " fill-rule="nonzero" fill="#EEEEEE">
        <path d="M0,4.96972188 C0,3.86143684 0.899814069,2.95171147 1.99402962,2.93799103 L158.00597,0.981747188 C159.107243,0.967938265 160,1.84646522 160,2.95103649 L160,5.98745286 C160,7.08887023 159.100186,7.96483876 158.00597,7.94427947 L1.99402962,5.012961 C0.89275747,4.99226913 0,4.08692473 0,2.96876746 L0,4.96972188 Z" id="Mask" transform="translate(80.000000, 4.463110) scale(-1, 1) translate(-80.000000, -4.463110) "></path>
      </g>
    </g>
  </svg>
  <% } %>
  <div class="UISlider is-standalone <% if (direction) { %>without-line<% } %> js-slider"></div>
  <span class="UISlider-label js-label"></span>
</li>
