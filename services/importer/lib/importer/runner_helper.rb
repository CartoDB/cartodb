module CartoDB
  module Importer2
    module RunnerHelper
      def should_import?(table_name)
        !should_skip?(table_name)
      end

      def success?
        # TODO: Change this, "runner" can be ok even if no data has changed, should expose "data_changed" attribute
        return true unless remote_data_updated?
        visualizations_count = @visualizations ? @visualizations.count : 0
        (results.count(&:success?) + visualizations_count) > 0 || @collision_strategy == 'skip'
      end

      private

      def should_skip?(table_name)
        return false unless @user && @collision_strategy == 'skip'

        Carto::Db::UserSchema.new(@user).table_names.include?(table_name)
      end
    end
  end
end