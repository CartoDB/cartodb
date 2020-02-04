<div class="CDB-Dashboard-menuContainer">
  <div class="CDB-Dashboard-menuInner">
    <div class="CDB-Dashboard-menuHeader">
      <% if (showLogo === true) { %>
      <div class="CDB-Dashboard-menuLogo">
        <a href="http://carto.com" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 62 24" height="24" width="62">
              <g class="CDB-EmbedLogo" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                  <path d="M3.94693333,15.9877346 C5.63066667,15.9877346 6.60373333,15.2552013 7.32533333,14.260268 L5.72906667,13.1232013 C5.26986667,13.6808013 4.79973333,14.0525346 4.0016,14.0525346 C2.93013333,14.0525346 2.17573333,13.1560013 2.17573333,12.0080013 L2.17573333,11.9861346 C2.17573333,10.8709346 2.93013333,9.95253464 4.0016,9.95253464 C4.73413333,9.95253464 5.23706667,10.3133346 5.6744,10.849068 L7.27066667,9.6136013 C6.5928,8.68426797 5.58693333,8.02826797 4.02346667,8.02826797 C1.7056,8.02826797 0,9.7776013 0,12.0080013 L0,12.029868 C0,14.3149346 1.76026667,15.9877346 3.94693333,15.9877346 L3.94693333,15.9877346 Z M10.93653,15.834668 L13.1559967,15.834668 L13.7026634,14.457068 L16.6655967,14.457068 L17.2122634,15.834668 L19.4863967,15.834668 L16.2282634,8.12666797 L14.18373,8.12666797 L10.93653,15.834668 Z M14.3258634,12.8061346 L15.1895967,10.6413346 L16.0423967,12.8061346 L14.3258634,12.8061346 Z M23.61653,15.834668 L25.7375966,15.834668 L25.7375966,13.5168013 L26.6778633,13.5168013 L28.2194633,15.834668 L30.6575966,15.834668 L28.83173,13.1669346 C29.78293,12.7624013 30.40613,11.9861346 30.40613,10.8053346 L30.40613,10.783468 C30.40613,10.029068 30.17653,9.4496013 29.7282633,9.00133464 C29.2143966,8.48746797 28.40533,8.18133464 27.2354633,8.18133464 L23.61653,8.18133464 L23.61653,15.834668 Z M25.7375966,11.8549346 L25.7375966,10.0072013 L27.1370633,10.0072013 C27.8367966,10.0072013 28.2850633,10.3133346 28.2850633,10.9256013 L28.2850633,10.947468 C28.2850633,11.505068 27.8586633,11.8549346 27.1479966,11.8549346 L25.7375966,11.8549346 Z M36.7338633,15.834668 L38.8549299,15.834668 L38.8549299,10.0400013 L41.1509299,10.0400013 L41.1509299,8.18133464 L34.4487966,8.18133464 L34.4487966,10.0400013 L36.7338633,10.0400013 L36.7338633,15.834668 Z" class="CDB-EmbedLogo-text" fill="#FFFFFF"></path>
                  <g class="CDB-EmbedLogo-image"
                    <% if (hasTranslation) { %>
                      transform="translate(37.000000, 0.000000)"
                    <% } %>
                  >
                      <circle class="CDB-EmbedLogo-halo" fill="rgba(255, 255, 255, 0.20)"  cx="12.3333333" cy="12" r="12"></circle>
                      <path d="M12.3333333,16.5 C14.8186147,16.5 16.8333333,14.4852814 16.8333333,12 C16.8333333,9.51471863 14.8186147,7.5 12.3333333,7.5 C9.84805196,7.5 7.83333333,9.51471863 7.83333333,12 C7.83333333,14.4852814 9.84805196,16.5 12.3333333,16.5 L12.3333333,16.5 Z" class="CDB-EmbedLogo-point" fill="#FFFFFF" ></path>
                  </g>
              </g>
          </svg>
        </a>
      </div>
      <% } %>

      <ul class="CDB-Dashboard-menuActions">
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="https://twitter.com/share?url=<%- urlWithoutParams %>&text=<%- shortTitle %>" target="_blank" rel="noopener noreferrer" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-twitter CDB-Size-large"></i>
          </a>
        </li>
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="http://www.facebook.com/sharer.php?u=<%- urlWithoutParams %>&text=<%- shortTitle %>" target="_blank" rel="noopener noreferrer" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-facebook CDB-Size-medium"></i>
          </a>
        </li>
        <% if (inIframe) { %>
          <li class="CDB-Dashboard-menuActionsItem">
            <a href="<%- url %>" target="_blank" rel="noopener noreferrer" rel="noopener noreferrer" class="u-hintTextColor">
              <i class="CDB-IconFont CDB-IconFont-anchor CDB-Size-medium"></i>
            </a>
          </li>
        <% } %>
      </ul>


      <div class="CDB-Dashboard-menuInfo">
        <button class="js-toggle-view">
          <i class="CDB-IconFont CDB-Size-medium CDB-IconFont-rArrowLight Size-large"></i>
        </button>
      </div>

      <div class="CDB-Dashboard-menuTexts CDB-Dashboard-hideMobile">
        <div class="CDB-Dashboard-menuTextInner js-content">
          <button class="js-toggle-view u-actionTextColor CDB-Dashboard-menuTextActions">
            <svg width="10px" height="7px" viewBox="12 13 10 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <path d="M12,13.5 C12,13.2238576 12.1908338,13 12.4169561,13 L21.5830439,13 C21.8133224,13 22,13.2319336 22,13.5 C22,13.7761424 21.8091662,14 21.5830439,14 L12.4169561,14 C12.1866776,14 12,13.7680664 12,13.5 L12,13.5 L12,13.5 Z M12,16.5 C12,16.2238576 12.1908338,16 12.4169561,16 L21.5830439,16 C21.8133224,16 22,16.2319336 22,16.5 C22,16.7761424 21.8091662,17 21.5830439,17 L12.4169561,17 C12.1866776,17 12,16.7680664 12,16.5 L12,16.5 L12,16.5 Z M12,19.5 C12,19.2238576 12.1908338,19 12.4169561,19 L21.5830439,19 C21.8133224,19 22,19.2319336 22,19.5 C22,19.7761424 21.8091662,20 21.5830439,20 L12.4169561,20 C12.1866776,20 12,19.7680664 12,19.5 L12,19.5 L12,19.5 Z" id="Combined-Shape" stroke="none" fill="#1785fB" fill-rule="evenodd"></path>
            </svg>
          </button>
          <p class="CDB-Dashboard-menuTime CDB-Text CDB-Size-small u-upperCase u-altTextColor u-bSpace--m js-timeAgo">UPDATED <%- updatedAt %></p>
          <div class="CDB-Dashboard-metadata">
            <h1 class="CDB-Dashboard-menuTitle CDB-Dashboard-menuTitle--mobile CDB-Text CDB-Size-huge u-ellipsis js-title" title="<%- title %>"><%- title %></h1>

            <div class="CDB-Dashboard-scrollWrapper js-scroll-wrapper">
              <div class="CDB-Dashboard-scrollContent js-scroll-content">
                <h2 class="CDB-Dashboard-menuDescription CDB-Text CDB-Size-large is-light u-secondaryTextColor js-description"><%= cdb.core.sanitize.html(description) %></h2>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="CDB-Dashboard-menuFooter">
      <ul>
        <li class="CDB-Dashboard-menuFooterItem ">
          <div class="CDB-Dashboard-menuMedia CDB-Dashboard-menuAvatar">
            <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
          </div>
          <p class="CDB-Text CDB-Size-medium CDB-Dashboard-menuFooterTxt">Map by <a href="<%- userProfileURL %>" target="_blank" rel="noopener noreferrer"><%- userName %></a></p>
        </li>
      </ul>
    </div>
  </div>
  <div class="CDB-Dashboard-bg js-toggle-view"></div>

  <div class="CDB-Dashboard-menuHeaderMobile">
    <div class="u-flex u-alignStart CDB-Dashboard-menuHeaderMobileInner">
      <button class="js-toggle-view u-actionTextColor CDB-Dashboard-menuHeaderMobileActions">
        <i class="CDB-IconFont CDB-Size-medium CDB-IconFont-rArrowLight Size-large"></i>
      </button>
      <div class="CDB-Dashboard-menuHeaderMobileText">
        <% if (showLogo === true) { %>
        <div class="CDB-Dashboard-menuLogo">
          <a href="http://carto.com" target="_blank" rel="noopener noreferrer">
          <svg width="62px" height="24px" viewBox="35 63 62 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g class="CDB-EmbedLogo" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(35.000000, 63.000000)">
                  <path d="M3.94693333,15.9877346 C5.63066667,15.9877346 6.60373333,15.2552013 7.32533333,14.260268 L5.72906667,13.1232013 C5.26986667,13.6808013 4.79973333,14.0525346 4.0016,14.0525346 C2.93013333,14.0525346 2.17573333,13.1560013 2.17573333,12.0080013 L2.17573333,11.9861346 C2.17573333,10.8709346 2.93013333,9.95253464 4.0016,9.95253464 C4.73413333,9.95253464 5.23706667,10.3133346 5.6744,10.849068 L7.27066667,9.6136013 C6.5928,8.68426797 5.58693333,8.02826797 4.02346667,8.02826797 C1.7056,8.02826797 0,9.7776013 0,12.0080013 L0,12.029868 C0,14.3149346 1.76026667,15.9877346 3.94693333,15.9877346 L3.94693333,15.9877346 Z M10.93653,15.834668 L13.1559967,15.834668 L13.7026634,14.457068 L16.6655967,14.457068 L17.2122634,15.834668 L19.4863967,15.834668 L16.2282634,8.12666797 L14.18373,8.12666797 L10.93653,15.834668 Z M14.3258634,12.8061346 L15.1895967,10.6413346 L16.0423967,12.8061346 L14.3258634,12.8061346 Z M23.61653,15.834668 L25.7375966,15.834668 L25.7375966,13.5168013 L26.6778633,13.5168013 L28.2194633,15.834668 L30.6575966,15.834668 L28.83173,13.1669346 C29.78293,12.7624013 30.40613,11.9861346 30.40613,10.8053346 L30.40613,10.783468 C30.40613,10.029068 30.17653,9.4496013 29.7282633,9.00133464 C29.2143966,8.48746797 28.40533,8.18133464 27.2354633,8.18133464 L23.61653,8.18133464 L23.61653,15.834668 Z M25.7375966,11.8549346 L25.7375966,10.0072013 L27.1370633,10.0072013 C27.8367966,10.0072013 28.2850633,10.3133346 28.2850633,10.9256013 L28.2850633,10.947468 C28.2850633,11.505068 27.8586633,11.8549346 27.1479966,11.8549346 L25.7375966,11.8549346 Z M36.7338633,15.834668 L38.8549299,15.834668 L38.8549299,10.0400013 L41.1509299,10.0400013 L41.1509299,8.18133464 L34.4487966,8.18133464 L34.4487966,10.0400013 L36.7338633,10.0400013 L36.7338633,15.834668 Z" class="CDB-EmbedLogo-text" fill="#FFFFFF"></path>
                  <g class="CDB-EmbedLogo-image" transform="translate(37.000000, 0.000000)">
                      <circle class="CDB-EmbedLogo-halo" fill="rgba(255, 255, 255, 0.20)"  cx="12.3333333" cy="12" r="12"></circle>
                      <path d="M12.3333333,16.5 C14.8186147,16.5 16.8333333,14.4852814 16.8333333,12 C16.8333333,9.51471863 14.8186147,7.5 12.3333333,7.5 C9.84805196,7.5 7.83333333,9.51471863 7.83333333,12 C7.83333333,14.4852814 9.84805196,16.5 12.3333333,16.5 L12.3333333,16.5 Z" class="CDB-EmbedLogo-point" fill="#FFFFFF" ></path>
                  </g>
              </g>
          </svg>
          </a>
        </div>
        <% } %>
        <p class="CDB-Dashboard-menuTime CDB-Text CDB-Size-small u-upperCase u-altTextColor u-bSpace--m js-timeAgo">UPDATED <%- updatedAt %></p>
        <h1 class="CDB-Text CDB-Size-large u-ellipsis js-title u-bSpace--xl u-ellipsis"><%- title %></h1>
        <h2 class="CDB-Text CDB-Size-medium u-secondaryTextColor js-description"><%= cdb.core.sanitize.html(description) %></h2>
      </div>
    </div>
  </div>
</div>
