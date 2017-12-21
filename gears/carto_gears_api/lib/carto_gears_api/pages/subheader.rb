require 'values'

module CartoGearsApi
  module Pages
    # Link for subheader menu. It's a `Value`, so it must be created with `with`. Example:
    #
    #   CartoGearsApi::Pages::SubheaderLink.with(
    #     path: carto_gear_path(:my_gear, context, 'something'),
    #     text: 'The Text',
    #     controller: 'my_gear/something')
    #
    # @attr_reader [String] path Link path.
    # @attr_reader [String] text Link text.
    # @attr_reader [String] controller Controller path.
    class SubheaderLink < Value.new(:path, :text, :controller)
    end

    class Subheader
      include Singleton

      attr_accessor :links_generators

      def initialize
        @links_generators = []
      end

      def links(context)
        @links_generators.flat_map { |generator| generator.call(context) }.compact
      end
    end
  end
end
