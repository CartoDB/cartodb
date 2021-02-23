module FeatureFlagCommands
  class Delete < ::CartoCommand

    private

    def run_command
      Carto::FeatureFlag.find(params[:feature_flag][:id])
                        .destroy!
    end

    def log_context
      super.merge(feature_flag_id: params[:feature_flag][:id])
    end

  end
end
