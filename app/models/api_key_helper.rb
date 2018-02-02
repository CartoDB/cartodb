module ApiKeyHelper
  def create_api_keys
    return unless !Carto::ApiKey.exists?(user_id: id)
    Carto::ApiKey.create(
      user_id: id,
      type: Carto::ApiKey::TYPE_MASTER
    )

    Carto::ApiKey.create(
      user_id: id,
      type: Carto::ApiKey::TYPE_DEFAULT_PUBLIC
    )
  end
end
