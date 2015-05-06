module Carto
  module Api
    class ImportsController < ::Api::ApplicationController

      def index
        imports = DataImportsService.new.process_recent_user_imports(current_user)
        render json: { imports: imports.map(&:id), success: true }
      end

    end
  end
end
