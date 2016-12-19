# encoding: utf-8

module Carto
  module Tracking
    module Validators
      module Widget
        module Existence
          def check_widget_exists!
            unless @format.fetch_record!(:widget)
              raise Carto::LoadError.new('Widget not found')
            end
          end
        end
      end
    end
  end
end
