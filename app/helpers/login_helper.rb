# coding: utf-8

module LoginHelper

  # TODO: Check this for MU
  def forget_password_url
    if Cartodb.config[:account_host]
      "#{request.protocol}#{Cartodb.config[:account_host]}/password_resets/new"
    end
  end
  
end
