# encoding: utf-8

class Superadmin::PricePlansController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy

  before_filter :get_account_type, only: [:create, :update, :destroy]

  def create
    byebug
    ActiveRecord::Base.transaction do
      @account_type.rate_limit = @rate_limit
      @account_type.save
    end

    render json: @account_type, status: 204
  end

  def update
    byebug
    ActiveRecord::Base.transaction do
      @account_type.rate_limit.destroy
      @rate_limit.save
      @account_type.rate_limit = @rate_limit
      @account_type.save
    end

    render json: @account_type, status: 204
  end

  def destroy
    byebug
    if @account_type.present?
      @account_type.rate_limit.destroy
      @account_type.destroy
    end
    render json: @account_type, status: 204
  end

  private

  def get_account_type
    byebug
    price_plan_params = params[:price_plan]

    @rate_limit = Carto::RateLimit.from_api_attributes(price_plan_params[:rate_limit])

    account_type = price_plan_params[:account_type]
    if Carto::AccountType.exists?(account_type)
      @account_type = Carto::AccountType.find(account_type)
    else
      @account_type = Carto::AccountType.new
      @account_type.account_type = account_type
    end
  end

end
