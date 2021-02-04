module FeatureFlagCommands
  class Update < ::CartoCommand

    private

    def run_command
      Carto::FeatureFlag.find(feature_flag_params[:id])
                        .update!(feature_flag_update_params)
    end

    def feature_flag_update_params
      feature_flag_params.slice(:name, :restricted)
    end

    def feature_flag_params
      params[:feature_flag]
    end

    def log_context
      super.merge(
        feature_flag_id: feature_flag_params[:id],
        feature_flag_name: feature_flag_params[:name]
      )
    end

  end
end
