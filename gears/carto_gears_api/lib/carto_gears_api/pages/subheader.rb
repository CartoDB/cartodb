module CartoGearsApi
  module Pages
    class Subheader
      include Singleton

      attr_accessor :links_generators

      def initialize
        @links_generators = []
      end

      def links(context)
        @links_generators.flat_map { |generator| generator.call(context) }
      end
    end
  end
end
