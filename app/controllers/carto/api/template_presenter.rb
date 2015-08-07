module Carto
  module Api
    class TemplatePresenter

      def initialize(template)
        @template = template
      end

      # When used inside a list, parent will be a " items: [ ... ] "
      def public_values
        {
          id:                     @template.id,
          title:                  @template.title,
          description:            @template.description,
          source_visualization:   {
                                    id: @template.source_visualization_id
                                  },
          min_supported_version:  @template.min_supported_version,
          max_supported_version:  @template.max_supported_version,
          code:                   @template.code,
          organization:           {
                                    id: @template.organization_id
                                  },
          required_tables:        @template.required_tables,
          created_at:             @template.created_at
        }
      end

    end
  end
end
