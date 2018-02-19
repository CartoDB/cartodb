module TrackjsHelper
  def insert_trackjs(app = 'editor')
    if Cartodb.get_config(:trackjs, 'customer') && params[:cookies] != '0'
      customer = Cartodb.get_config(:trackjs, 'customer')
      enabled = Cartodb.get_config(:trackjs, 'enabled')
      app_key = Cartodb.get_config(:trackjs, 'app_keys', app)
      version = CartoDB::Application.frontend_version

      locals = { customer: customer, enabled: enabled, app_key: app_key, version: version }
      render(partial: 'shared/trackjs', locals: locals)
    end
  end
end
