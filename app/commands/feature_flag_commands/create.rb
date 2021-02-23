module FeatureFlagCommands
  class Create < ::CartoCommand

    private

    def run_command
      Carto::FeatureFlag.create!(feature_flag_params)
    end

    def feature_flag_params
      params[:feature_flag].slice(:id, :name, :restricted)
    end

    def log_context
      super.merge(
        feature_flag_id: feature_flag_params[:id],
        feature_flag_name: feature_flag_params[:name]
      )
    end

  end
end
