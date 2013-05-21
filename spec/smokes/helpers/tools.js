module.exports = {
	auth: function(url) {
  		return(url + "?api_key=" + configuration.API_KEY);
	}
}
