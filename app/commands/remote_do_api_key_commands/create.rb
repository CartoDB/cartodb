module RemoteDoApiKeyCommands
  class Create < ::CartoCommand

    private

    def run_command
      api_key = Carto::RemoteDoApiKey.new(params)
      api_key.save!
    end

  end
end
