module CartoDB
  module Datasources
    module Decorators
      class BaseDecorator

        # @return bool
        def decorates_layer?
          raise 'To be implemented in child classes'
        end

        # @param layer Layer|nil
        # @return bool
        def layer_eligible?(layer=nil)
          raise 'To be implemented in child classes'
        end

        # @param layer Layer|nil
        def decorate_layer!(layer=nil)
          raise 'To be implemented in child classes'
        end

      end
    end
  end
end
