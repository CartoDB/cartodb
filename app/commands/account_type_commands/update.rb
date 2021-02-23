module AccountTypeCommands
  class Update < ::CartoCommand

    private

    def run_command
      @account_type = Carto::AccountType.find(account_type_params[:account_type])

      if rate_limit_changed?
        @account_type.rate_limit.update!(@received_rate_limit.rate_limit_attributes)
        logger.info(log_context.merge(message: 'Rate limit updated'))
        ::Resque.enqueue(::Resque::UserJobs::RateLimitsJobs::SyncRedis, @account_type.account_type)
      end
    end

    def rate_limit_changed?
      @received_rate_limit = Carto::RateLimit.from_api_attributes(
        account_type_params[:rate_limit] || {}
      )

      @account_type.rate_limit != @received_rate_limit
    end

    def account_type_params
      params[:price_plan]
    end

    def log_context
      super.merge(account_type: account_type_params[:account_type])
    end

  end
end
