function ready() {
  var div = document.createElement("div");
  div.style.position = 'absolute',
  div.style.bottom = '40px'
  div.style.left = '0'
  div.style.right = '0'
  div.style.with = '100%'
  div.style.padding = '10px'
  div.innerHTML = `
  <h4>Hey! This content applies only to previous CARTO products</h4>
  <p>Please check if it's relevant to your use case. On October 2021 we released a new version of our platform.</p>
  <p>You can learn more and read the latest documentation at <a target="_blank" href="https://docs.carto.com">docs.carto.com</a></p>
  `;
  
  document.getElementsByTagName("nav")[0].appendChild(div);
}


document.addEventListener("DOMContentLoaded", ready);
