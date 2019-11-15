class Superadmin::OauthAppsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required

  before_action :load_oauth_app, only: [:update, :destroy]

  ALLOWED_SYNC_PARAMS = Carto::OauthApp::ALLOWED_SYNC_ATTRIBUTES + [:user_id, redirect_uris: []].freeze

  def create
    @oauth_app = Carto::OauthApp.create!(oauth_params)

    render json: @oauth_app, status: 201
  end

  def update
    @oauth_app.update!(oauth_params)

    render nothing: true, status: 204
  end

  def destroy
    @oauth_app.avoid_sync_central = true
    @oauth_app.destroy!

    render nothing: true, status: 204
  end

  private

  def load_oauth_app
    @oauth_app = Carto::OauthApp.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'ERROR. oauth_app not found' }, status: 404
  end

  def oauth_params
    params[:oauth_app].permit(ALLOWED_SYNC_PARAMS)
                      .merge(avoid_sync_central: true)
  end
end
