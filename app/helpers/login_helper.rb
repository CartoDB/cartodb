# coding: utf-8

module LoginHelper
  
  def forget_password_url
    if Cartodb.config[:account_host]
      "#{request.protocol}#{Cartodb.config[:account_host]}/password_resets/new"
    end
  end
  
end
