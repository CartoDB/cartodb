require 'carto/db/user_schema'
require_relative '../../../../app/models/carto/data_import_constants'

module CartoDB
  module Importer2
    # Needs @visualizations and @collision strategy instance variables in classes including this.
    module RunnerHelper
      def should_import?(table_name)
        !should_skip?(table_name)
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
