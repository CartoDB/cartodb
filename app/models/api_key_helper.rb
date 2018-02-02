module ApiKeyHelper
  def create_api_keys
    return unless !Carto::ApiKey.exists?(user_id: id)
    Carto::ApiKey.create(
      user_id: id,
      type: Carto::ApiKey::TYPE_MASTER,
      name: Carto::ApiKey::MASTER_NAME
    )
  end
end
