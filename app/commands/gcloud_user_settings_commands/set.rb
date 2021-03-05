module GcloudUserSettingsCommands
  class Set < ::CartoCommand

    private

    def run_command
      Carto::GCloudUserSettings.new(username).update(gcloud_settings)
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
