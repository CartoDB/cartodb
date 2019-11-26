require_relative './carto_json_serializer'
require_relative '../../controllers/carto/api/legend_presenter'
require_dependency 'carto/legend_definition_validator'

module Carto
  class Legend < ActiveRecord::Base
    self.inheritance_column = :_type

    belongs_to :layer, class_name: Carto::Layer

    VALID_LEGEND_TYPES = %w(category bubble choropleth custom custom_choropleth torque).freeze
    LEGEND_TYPES_PER_ATTRIBUTE = {
      color: %w(category choropleth custom custom_choropleth torque),
      size: %w(bubble)
    }.freeze

    serialize :definition, ::Carto::CartoJsonSymbolizerSerializer
    serialize :conf, ::Carto::CartoJsonSymbolizerSerializer

    validates :definition, carto_json_symbolizer: true
    serialize :conf, ::Carto::CartoJsonSymbolizerSerializer
    validates :type, :layer, presence: true
    validates :type, inclusion: { in: VALID_LEGEND_TYPES }, allow_nil: true

    validate :on_data_layer,
             :under_max_legends_per_layer,
             :under_max_legends_per_layer_and_type,
             :validate_definition_schema,
             :validate_conf_schema

    before_validation :ensure_definition, :ensure_conf

    after_save :force_notify_layer_change
    after_destroy :force_notify_layer_change

    private

    def ensure_definition
      self.definition ||= Hash.new
    end

    def ensure_conf
      self.conf ||= Hash.new
    end

    def on_data_layer
      if layer && !layer.data_layer?
        errors.add(:layer, "'#{layer.kind}' layers can't have legends")
      end
    end

    MAX_LEGENDS_PER_LAYER = 2

    def under_max_legends_per_layer
      if layer
        other_legends = layer.legends.select { |legend| legend.id != id }

        unless other_legends.count < MAX_LEGENDS_PER_LAYER
          errors.add(:layer, 'Maximum number of legends per layer reached')
        end
      end
    end

    def under_max_legends_per_layer_and_type
      return unless type
      LEGEND_TYPES_PER_ATTRIBUTE.each do |attribute, legend_types|
        next unless legend_types.include?(type)

        other_legends_present = layer.legends.any? { |legend| legend.id != id && legend_types.include?(legend.type) }
        errors.add(:layer, "Only one #{attribute} legend per layer allowed") if other_legends_present
      end
    end

    def validate_definition_schema
      validator = Carto::LegendDefinitionValidator.new(type, definition)
      definition_errors = validator.errors

      if definition_errors.any?
        errors.add(:definition, definition_errors.join(', '))
      end
    end

    def validate_conf_schema
      schema = Carto::Definition.instance
                                .load_from_file('lib/formats/legends/conf.json')

      parsed_conf = conf.try(:is_a?, Hash) ? conf.with_indifferent_access : conf
      conf_errors = JSON::Validator.fully_validate(schema, parsed_conf)

      if conf_errors.any?
        errors.add(:conf, conf_errors.join(', '))
      end
    end

    def force_notify_layer_change
      layer.force_notify_change
    end
  end
end
