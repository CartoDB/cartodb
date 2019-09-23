module EmbedHelper
  def get_owner_data(owner)
    {
      base_url: owner.public_url,
      account_type: owner.account_type
    }
  end
end
