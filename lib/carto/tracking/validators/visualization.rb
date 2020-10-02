module Carto
  module Tracking
    module Validators
      module Visualization

        module Helpers

          def visualization
            @format.fetch_record!(:visualization)
          end

        end

        module Writable

          include Carto::Tracking::Validators::Visualization::Helpers

          def check_visualization_writable!
            raise Carto::UnauthorizedError.new unless visualization.writable_by?(@reporter)
          end

        end

        module Readable

          include Carto::Tracking::Validators::Visualization::Helpers

          def check_visualization_readable!
            raise Carto::UnauthorizedError.new unless visualization.is_accesible_by_user?(@reporter)
          end

        end

      end
    end
  end
end
