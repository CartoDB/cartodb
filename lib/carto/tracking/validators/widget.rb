module Carto
  module Tracking
    module Validators
      module Widget
        module Existence

          def check_widget_exists!
            raise Carto::LoadError.new('Widget not found') unless @format.fetch_record!(:widget)
          end

        end
      end
    end
  end
end
