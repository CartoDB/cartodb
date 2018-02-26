<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="12px" height="23px" viewBox="0 0 12 23" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path d="M3.85948829,15.9093411 L3.85948829,15.113874 C3.85948829,13.9648603 4.03625698,13.0196388 4.38979966,12.2781813 C4.74334234,11.5367237 5.40131468,10.7535402 6.36373642,9.92860729 C7.6993421,8.79923484 8.54144849,7.94976308 8.89008086,7.38016654 C9.23871322,6.81057 9.41302679,6.12313622 9.41302679,5.31784456 C9.41302679,4.3161403 9.09140598,3.54277728 8.44815472,2.99773232 C7.80490345,2.45268735 6.87932296,2.18016896 5.67138547,2.18016896 C4.8955557,2.18016896 4.13937853,2.27100842 3.40283128,2.45269008 C2.66628403,2.63437173 1.82172252,2.96581302 0.869121409,3.44702389 L0,1.45835626 C1.85609907,0.486113893 3.7956444,0 5.81869418,0 C7.69443451,0 9.15277619,0.461562686 10.193763,1.38470191 C11.2347497,2.30784113 11.7552353,3.60905508 11.7552353,5.28838281 C11.7552353,6.0052888 11.6594856,6.63625482 11.4679833,7.18129978 C11.2764811,7.72634475 10.9941422,8.24192009 10.6209582,8.72804127 C10.2477743,9.21416246 9.44249472,9.99734595 8.20509534,11.0776153 C7.21321171,11.9221894 6.55769449,12.6243539 6.23852401,13.1841299 C5.91935354,13.7439058 5.7597707,14.4902624 5.7597707,15.4232223 L5.7597707,15.9093411 L3.85948829,15.9093411 Z M2.95990869,20.3988536 C2.95990869,19.3235103 3.49337277,18.7858468 4.56031694,18.7858468 C5.07600662,18.7858468 5.47388191,18.9242161 5.75395476,19.2009588 C6.0340276,19.4777016 6.17406192,19.8769958 6.17406192,20.3988536 C6.17406192,20.9048974 6.03180483,21.2982616 5.74728639,21.5789578 C5.46276794,21.859654 5.06711542,22 4.56031694,22 C4.09797446,22 3.71565854,21.8754676 3.41335769,21.6263992 C3.11105685,21.3773307 2.95990869,20.9681529 2.95990869,20.3988536 Z" stroke="none" fill="#FEB100" fill-rule="evenodd" opacity="1"></path>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--xl">
        <%- _t('dataset.rename.title', { tableName: tableName }) %>
      </h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor"><%- _t('dataset.rename.desc') %></p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.rename.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.rename.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>