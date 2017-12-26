module SqlApiHelper
  def sql_api_template(privacy="private")
    sql_api_url('{user}', privacy)
  end

  def sql_api_url(username, privacy = 'private')
    sql_api = Cartodb.config[:sql_api][privacy]
    if CartoDB.subdomainless_urls?
      sql_api["protocol"] + "://" + sql_api["domain"] + ":" + sql_api["port"].to_s + "/user/#{username}"
    else
      sql_api["protocol"] + "://#{username}." + sql_api["domain"] + ":" + sql_api["port"].to_s
    end
  end
end
