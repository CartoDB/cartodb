module RemoteDoApiKeyCommands
  class Destroy < ::CartoCommand

    private

    def run_command
      api_key = Carto::RemoteDoApiKey.new(params)
      api_key.destroy!
    end

  end
end
