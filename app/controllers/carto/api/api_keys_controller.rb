class Carto::Api::ApiKeysController < ::Api::ApplicationController
  ssl_required :create
  before_filter :optional_api_authorization

  def create
    api_key = ::Carto::ApiKey.new
    api_key.user_id = current_user.id
    api_key.type = ::Carto::ApiKey::TYPE_REGULAR
    api_key.name = params[:name]
    api_key.grants_json = params[:grants]
    api_key.save!
    render_jsonp(::Carto::Api::ApiKeyPresenter.new(api_key).to_poro)
  end
end
