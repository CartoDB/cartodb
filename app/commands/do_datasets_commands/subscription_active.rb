module DoDatasetsCommands
  class SubscriptionActive < ::CartoCommand

    private

    def run_command
      subscription = licensing_service.subscription(params[:dataset_id])
      add_to_redis(subscription.merge(status: 'active'))
    end

    def licensing_service
      @licensing_service ||= Carto::DoLicensingService.new(params[:username])
    end

  end
end
