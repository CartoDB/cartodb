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
            unless visualization.writable_by?(@reporter)
              raise Carto::UnauthorizedError.new
            end
          end
        end

        module Readable
          include Carto::Tracking::Validators::Visualization::Helpers

          def check_visualization_readable!
            unless visualization.is_accesible_by_user?(@reporter)
              raise Carto::UnauthorizedError.new
            end
          end
        end
      end
    end
  end
end
