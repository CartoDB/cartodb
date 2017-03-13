module AppAssetsHelper
  def app_assets_base_url
    asset_host = CartoDB.get_absolute_url(Cartodb.get_config(:app_assets, 'asset_host'))
    base_url = asset_host.present? ? asset_host : CartoDB.base_domain_from_request(request)
    "#{base_url}/assets"
  end
end

