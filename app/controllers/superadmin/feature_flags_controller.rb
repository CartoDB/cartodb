class Superadmin::FeatureFlagsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy

  before_filter :get_feature_flag, only: [:create, :update, :destroy]

  def create
    @feature_flag.save
    render json: @feature_flag, status: 204
  end

  def update
    @feature_flag.save
    render json: @feature_flag, status: 204
  end

  def destroy
    if @feature_flag.present?
      @feature_flag.destroy
    end
    render json: @feature_flag, status: 204
  end

  private

  def get_feature_flag
    feature_flag_params = params[:feature_flag]
    @feature_flag = Carto::FeatureFlag.find_or_initialize_by(id: feature_flag_params[:id])
    @feature_flag.name = feature_flag_params[:name]
    @feature_flag.restricted = feature_flag_params[:restricted]
  end

end
