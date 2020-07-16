class Carto::Api::MultifactorAuthsController < ::Api::ApplicationController
  ssl_required

  before_action :load_user

  before_action :load_multifactor_auth, only: [:show, :verify_code, :destroy]

  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

  def create
    multifactor_auth = @carto_viewer.user_multifactor_auths.create!(create_params)
    render json: Carto::Api::MultifactorAuthPresenter.new(multifactor_auth).to_poro_with_qrcode, status: 201
  rescue ActionController::ParameterMissing => e
    raise Carto::UnprocesableEntityError.new(e.message)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def verify_code
    @multifactor_auth.verify!(params[:code])
    render json: Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, status: 200
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def destroy
    @multifactor_auth.destroy
    render json: Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, status: 204
  end

  def show
    render json: Carto::Api::MultifactorAuthPresenter.new(@multifactor_auth).to_poro, status: 200
  end

  def index
    auths = @carto_viewer.user_multifactor_auths.map do |auth|
      Carto::Api::MultifactorAuthPresenter.new(auth).to_poro
    end

    render json: auths, status: 200
  end

  private

  def load_user
    @carto_viewer = Carto::User.find(current_viewer.id)
  end

  def load_multifactor_auth
    @multifactor_auth = @carto_viewer.user_multifactor_auths.find(params[:id])
  end

  def create_params
    { type: params.require(:type) }
  end

end
