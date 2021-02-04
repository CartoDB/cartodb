module AccountTypeCommands
  class Create < ::CartoCommand

    private

    def run_command
      @account_type = Carto::AccountType.find_by(account_type: account_type_literal) ||
                      Carto::AccountType.new(account_type: account_type_literal)

      @account_type.rate_limit = Carto::RateLimit.from_api_attributes(rate_limit_params || {})
      @account_type.save!
    end

    def account_type_literal
      params.dig(:price_plan, :account_type)
    end

    def rate_limit_params
      params.dig(:price_plan, :rate_limit)
    end

    def log_context
      super.merge(
        account_type: account_type_literal,
        rate_limit_params: rate_limit_params.inspect # avoid generating too many fields in Kibana
      )
    end

  end
end
