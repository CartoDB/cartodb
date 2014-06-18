# encoding: utf-8

module CartoDB
  module Overlay
    class Copier

      def initialize(visualization_id)
        @visualization_id = visualization_id
      end

      def copy_from(overlay)
        Member.new(
          order: overlay.order,
          type: overlay.type,
          template: overlay.template,
          options: ::JSON.parse(overlay.options),
          visualization_id: @visualization_id
        )
      end

    end
  end
end

