module AccountTypeCommands
  class Create < ::CartoCommand

    private

    def run_command
      @account_type = Carto::AccountType.find_by(account_type: account_type_literal) ||
                      Carto::AccountType.new(account_type: account_type_literal)

      @account_type.rate_limit = Carto::RateLimit.from_api_attributes(
        params[:price_plan][:rate_limit] || {}
      )
      @account_type.save!
    end

    def account_type_literal
      params[:price_plan][:account_type]
    end

  end
end
