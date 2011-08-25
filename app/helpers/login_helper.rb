module LoginHelper
  
  def forget_password_url
    if APP_CONFIG[:account_host]
      "#{request.protocol}#{APP_CONFIG[:account_host]}/password_resets/new"
    end
  end
  
end
