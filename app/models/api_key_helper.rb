module ApiKeyHelper
  def create_api_keys
    Carto::ApiKey.create(
      user_id: id,
      type: Carto::ApiKey::TYPE_MASTER,
      name: Carto::ApiKey::MASTER_NAME
    )
  end
end
