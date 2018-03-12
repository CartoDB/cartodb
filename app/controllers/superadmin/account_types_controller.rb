# encoding: utf-8

class Superadmin::AccountTypesController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy

  before_filter :get_account_type, only: [:create, :update, :destroy]

  def create
    ActiveRecord::Base.transaction do
      @account_type.rate_limit = @rate_limit
      @account_type.save
    end

    render json: @account_type, status: 204
  end

  def update
    ActiveRecord::Base.transaction do
      if @account_type.rate_limit
        @account_type.rate_limit.update_attributes!(@rate_limit.rate_limit_attributes)
      else
        @account_type.rate_limit = @rate_limit
      end

      @account_type.save
    end

    render json: @account_type, status: 204
  end

  def destroy
    if @account_type.present?
      @account_type.destroy
    end
    render json: @account_type, status: 204
  end

  private

  def get_account_type
    account_type_params = params[:account_type]

    if account_type_params
      @rate_limit = Carto::RateLimit.from_api_attributes(account_type_params[:rate_limit] || {})
      account_type = account_type_params[:account_type]
    else
      account_type = params[:id]
    end

    if Carto::AccountType.exists?(account_type)
      @account_type = Carto::AccountType.find(account_type)
    else
      @account_type = Carto::AccountType.new
      @account_type.account_type = account_type
    end
  end
end
