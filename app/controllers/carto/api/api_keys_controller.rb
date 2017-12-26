class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper

  ssl_required :create
  before_filter :api_authorization_required
  before_filter :check_feature_flag

  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

  def create
    api_key = Carto::ApiKey.create!(
      user_id: current_user.id,
      type: Carto::ApiKey::TYPE_REGULAR,
      name: params[:name],
      grants: params[:grants]
    )
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  private

  def check_feature_flag
    render_404 unless current_user.try(:has_feature_flag?, 'auth_api')
  end
end
