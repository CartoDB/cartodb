# encoding: utf-8

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
    @feature_flag = FeatureFlag[feature_flag_params[:id]]
    if !@feature_flag.present?
      @feature_flag = FeatureFlag.new
      @feature_flag.id = feature_flag_params[:id]
    end
    @feature_flag.name = feature_flag_params[:name]
    @feature_flag.restricted = feature_flag_params[:restricted]
  end

end
