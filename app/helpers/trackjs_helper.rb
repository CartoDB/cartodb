module TrackjsHelper
  def insert_trackjs(app = 'editor', freq = 1)
    lucky = freq.nil? || freq >= rand
    if Cartodb.get_config(:trackjs, 'customer') && params[:cookies] != '0' && lucky
      customer = Cartodb.get_config(:trackjs, 'customer')
      enabled = Cartodb.get_config(:trackjs, 'enabled')
      app_key = Cartodb.get_config(:trackjs, 'app_keys', app)
      version = CartoDB::Application.frontend_version
      is_embed = app == 'embeds' || app == 'builder-embeds'
      locals = { customer: customer, enabled: enabled, app_key: app_key, version: version, is_embed: is_embed }
      render(partial: 'shared/trackjs', locals: locals)
    end
  end
end
