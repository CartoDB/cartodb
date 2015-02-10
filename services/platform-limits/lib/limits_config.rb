
module CartoDB
  module PlatformLimits

    # Configuration for static/fixed platform limits
    # TODO: Make them read from config?
    class LimitsConfig

      IMPORTER_LIMITS = {
        InputFileSize: {
          max_value: 50*1024*1024     # TODO: Temporal value, for testing purposes only
        }
      }

    end

  end
end