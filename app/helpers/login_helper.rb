# coding: utf-8

module LoginHelper

  def forget_password_url
    if CartoDB.account_host
      "#{request.protocol}#{CartoDB.account_host}/password_resets/new"
    end
  end
  
end
