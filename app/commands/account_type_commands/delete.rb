module AccountTypeCommands
  class Delete < ::CartoCommand

    private

    def run_command
      @account_type = Carto::AccountType.find_by(
        account_type: account_type
      )

      # Don't break if account_type does not exist, as it is harmless
      if @account_type.nil?
        logger.warn(log_context.merge(message: 'AccountType not found'))
        return
      end

      @account_type.destroy!

      logger.info(log_context.merge(message: 'AccountType destroyed'))
    end

    def account_type
      params[:price_plan][:account_type]
    end

    def log_context
      super.merge(account_type: account_type)
    end

  end
end
