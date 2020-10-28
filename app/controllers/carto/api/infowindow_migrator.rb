module Carto
  module Api
    module InfowindowMigrator
      MUSTACHE_ROOT_PATH = 'lib/assets/javascripts/builder/mustache-templates'.freeze

      def migrate_builder_infowindow(templated_element, mustache_dir: 'infowindows')
        return nil if templated_element.nil?

        template = templated_element['template']
        return templated_element if template.present?

        templated_sym = templated_element.deep_symbolize_keys

        old_template_name = templated_sym[:template_name]
        return templated_element if old_template_name == 'none'

        fields = templated_element['fields']
        unless fields.present?
          templated_element['template_name'] = 'none'
          return templated_element
        end

        if MIGRATED_TEMPLATES.include?(old_template_name)
          new_template_name = 'infowindow_color'

          fixed_color = extract_color_from_old_template(old_template_name)

          template_content_path = "#{MUSTACHE_ROOT_PATH}/#{mustache_dir}/infowindow_color.jst.mustache"

          templated_element[:template] = get_template(
            new_template_name,
            templated_sym[:template],
            template_content_path).gsub('#35AAE5', fixed_color)

          templated_element[:headerColor] = {
            color: {
              opacity: 1,
              fixed: fixed_color
            }
          }
        else
          new_template_name = parse_old_template_name(old_template_name)

          templated_element[:template] = get_template(
            old_template_name,
            templated_sym[:template],
            "#{MUSTACHE_ROOT_PATH}/#{mustache_dir}/#{get_template_name(old_template_name)}.jst.mustache")
        end

        templated_element[:template_name] = new_template_name

        templated_element
      end

      private

      INFOWINDOW_COLOR_TEMPLATE = 'infowindow_color'.freeze

      MIGRATED_TEMPLATES = %w{ infowindow_light_header_blue infowindow_light_header_yellow
                               infowindow_light_header_orange infowindow_light_header_green }.freeze

      COLOR_MAP = {
        'blue' => '#35AAE5',
        'green' => '#7FC97F',
        'orange' => '#E68165',
        'yellow' => '#E5C13D'
      }.freeze

      def extract_color_from_old_template(old_template_name)
        COLOR_MAP[old_template_name.split('_').last]
      end

      def parse_old_template_name(old_template_name)
        Pathname.new(old_template_name).basename.to_s
      rescue StandardError => exception
        log_error(message: "InfowindowMigrator: Error parsing template", exception: exception, old_template_name: old_template_name)
        old_template_name
      end

      def get_template_name(name)
        Carto::Layer::TEMPLATES_MAP.fetch(name, name)
      end

      def get_template(template_name, fallback_template, template_path)
        if template_name.present?
          path = Rails.root.join(template_path)
          File.read(path)
        else
          fallback_template
        end
      end
    end
  end
end
