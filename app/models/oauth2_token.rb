class Oauth2Token < AccessToken
  
  def as_json(options={})
    {:access_token=>token}
  end
end
