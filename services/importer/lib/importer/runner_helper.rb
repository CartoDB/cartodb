require 'carto/db/user_schema'
require_relative '../../../../app/models/carto/data_import_constants'

module CartoDB
  module Importer2
    # Needs @visualizations and @collision strategy instance variables in classes including this.
    module RunnerHelper
      def should_import?(table_name)
        !should_skip?(table_name)
      end

      def success?
        # TODO: Change this, "runner" can be ok even if no data has changed, should expose "data_changed" attribute
        return true unless remote_data_updated?
        visualizations_count = @visualizations ? @visualizations.count : 0
        (results.count(&:success?) + visualizations_count) > 0 || @collision_strategy == SKIP
      end

      private

      def should_skip?(table_name)
        return false unless @user && @collision_strategy == SKIP

        Carto::Db::UserSchema.new(@user).table_names.include?(table_name)
      end

      SKIP = Carto::DataImportConstants::COLLISION_STRATEGY_SKIP
    end
  end
end
