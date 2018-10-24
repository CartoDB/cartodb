class Carto::Api::MultifactorAuthsController < ::Api::ApplicationController
  include Carto::ControllerHelper

  ssl_required :create, :destroy, :validate_code, :show, :index

  before_action :load_user
  before_action :check_ff
  before_action :check_shared_secret_not_present, only: [:create, :validate_code]
  before_action :load_multifactor_auth, only: [:show, :validate_code, :destroy]

  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

  def create
    multifactor_auth = @carto_viewer.user_multifactor_auths.create!(create_params)
    render_jsonp(Carto::Api::MultifactorAuthPresenter.new(multifactor_auth).to_poro_with_qrcode, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def validate_code
    @multifactor_auth.verify!(params[:code])
    render_jsonp(Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, 200)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def destroy
    @multifactor_auth.destroy
    render_jsonp(Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, 200)
  end

  def show
    render_jsonp(Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, 200)
  end

  def index
    auths = @carto_viewer.user_multifactor_auths.map do |auth|
      Carto::Api::MultifactorAuthPresenter.new(auth).to_poro
    end

    render_jsonp(auths, 200)
  end

  private

  def load_user
    @carto_viewer = Carto::User.find(current_viewer.id)
  end

  def load_multifactor_auth
    @multifactor_auth = @carto_viewer.user_multifactor_auths.find(params[:id])
  end

  def check_shared_secret_not_present
    error_msg = "The 'shared_secret' parameter is not allowed for this endpoint".freeze
    raise Carto::UnprocesableEntityError.new(error_msg) if params[:shared_secret].present?
  end

  def create_params
    params.permit(:type)
  end

  def check_ff
    raise Carto::UnauthorizedError.new unless @carto_viewer.has_feature_flag?('mfa')
  end
end
