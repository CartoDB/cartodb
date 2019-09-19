module EmbedHelper
  def get_user_data(user)
    {
      base_url: user.public_url,
      account_type: user.account_type
    }
  end
end
