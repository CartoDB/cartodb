# encoding: utf-8

class Superadmin::AccountTypesController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy

  before_filter :get_account_type, only: [:update, :destroy]
  before_filter :get_rate_limit, only: [:create, :update]

  def create
    if Carto::AccountType.exists?(params[:account_type][:account_type])
      @account_type = Carto::AccountType.find(params[:account_type][:account_type])
    else
      @account_type = Carto::AccountType.new
      @account_type.account_type = params[:account_type][:account_type]
    end

    @account_type.rate_limit = @rate_limit
    @account_type.save!

    render json: @account_type, status: 201
  end

  def update
    if @account_type.rate_limit != @rate_limit
      @account_type.rate_limit.update_attributes!(@rate_limit.rate_limit_attributes)
      ::Resque.enqueue(::Resque::UserJobs::RateLimitsJobs::SyncRedis, @account_type.account_type)
    end

    render json: @account_type, status: 200
  end

  def destroy
    @account_type.destroy

    render nothing: true, status: 204
  end

  private

  def get_account_type
    @account_type = Carto::AccountType.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'ERROR. account_type not found' }, status: 404
  end

  def get_rate_limit
    account_type_params = params[:account_type] || {}

    @rate_limit = Carto::RateLimit.from_api_attributes(account_type_params[:rate_limit] || {})

    render json: { error: 'ERROR. rate_limit object is not valid' }, status: 422 unless @rate_limit.valid?
  end
end
