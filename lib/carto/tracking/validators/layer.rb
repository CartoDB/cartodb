module Carto
  module Tracking
    module Validators
      module Layer
        def check_layer_belongs_to_visualization!
          layer = @format.fetch_record!(:layer)
          unless layer && layer.visualization == @format.fetch_record!(:visualization)
            raise Carto::UnauthorizedError.new
          end
        end
      end
    end
  end
end
