module GCloudUserSettingsCommands
  class Set < ::CartoCommand

    private

    def run_command
      Carto::GCloudUserSettings.new(username).update(gcloud_settings)
      logger.info(log_context.merge(message: 'gcloud user settings updated'))
    end

    def username
      params[:username]
    end

    def gcloud_settings
      params[:gcloud_settings]
    end

    def log_context
      super.merge(current_user: username)
    end

  end
end
