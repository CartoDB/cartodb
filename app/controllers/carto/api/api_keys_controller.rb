class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper
  include Carto::UUIDHelper

  ssl_required :create, :destroy, :regenerate_token

  before_filter :api_authorization_required
  before_filter :check_feature_flag
  before_filter :load_api_key, only: [:destroy, :regenerate_token]

  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Sequel::DatabaseError, with: :rescue_from_database_error

  def create
    api_key = Carto::ApiKey.create!(
      user_id: current_viewer.id,
      type: Carto::ApiKey::TYPE_REGULAR,
      name: params[:name],
      grants: params[:grants]
    )
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def destroy
    @api_key.destroy
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  def regenerate_token
    @api_key.create_token
    @api_key.save!
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  def rescue_from_database_error(error)
    rescue_from_carto_error(
      Carto::UnprocesableEntityError.new(/PG::Error: ERROR:  (.+)/ =~ error.message && $1 || 'unexpected error')
    )
  end

  private

  def check_feature_flag
    render_404 unless current_viewer.try(:has_feature_flag?, 'auth_api')
  end

  def load_api_key
    id = params[:id]
    if !is_uuid?(id) || !(@api_key = Carto::ApiKey.where(id: id).where(user_id: current_viewer.id).first)
      raise Carto::LoadError.new("API key not found: #{id}")
    end
  end
end
