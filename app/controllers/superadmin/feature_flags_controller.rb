class Superadmin::FeatureFlagsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy

  before_filter :load_feature_flag, only: [:update, :destroy]

  def create
    Carto::FeatureFlag.create!(feature_flag_params)

    render json: @feature_flag, status: :no_content
  end

  def update
    @feature_flag.update!(feature_flag_params)

    render json: @feature_flag, status: :no_content
  end

  def destroy
    @feature_flag.destroy!

    render json: @feature_flag, status: :no_content
  end

  private

  def load_feature_flag
    @feature_flag = Carto::FeatureFlag.find(params[:id])
  end

  def feature_flag_params
    params.require(:feature_flag).permit(:id, :name, :restricted)
  end

end
