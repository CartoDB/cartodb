class Carto::Api::ApiKeysController < ::Api::ApplicationController
  ssl_required :create
  before_filter :api_authorization_required
  before_filter :check_feature_flag

  def create
    api_key = ::Carto::ApiKey.new(
      user_id: current_user.id,
      type: Carto::ApiKey::TYPE_REGULAR,
      name: params[:name],
      grants: params[:grants]
    )
    api_key.save!
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro)
  rescue ActiveRecord::RecordInvalid => e
    render_jsonp({ error: true, message: e.message }, 400)
  end

  private

  def check_feature_flag
    render_404 unless current_user.try(:has_feature_flag?, 'auth_api')
  end
end
