# encoding: utf-8

namespace :carto do
  namespace :legends do
    namespace :migration do
      desc 'Migrate html type legends to custom'
      task migrate_html_to_custom: :environment do
        html_legends = Carto::Legend.where(type: 'html')
        html_legends_count = html_legends.count

        errored = []
        puts "#{html_legends_count} html type legends..."
        html_legends.each_with_index do |legend, index|
          if Carto::Layer.exists?(legend.layer_id) && !legend.update_attributes(type: 'custom')
            errored << legend
          end

          printf "(#{index}/#{html_legends_count})"
        end

        2.times { puts }

        unless errored.empty?
          puts "Errored legend migrations (#{errored.count}):"
          errored.each do |legend|
            puts "#{legend.id}: #{legend.errors.full_messages.join(',')}"
          end
        end
      end

      desc 'Fix custom legends with images'
      task migrate_custom_image: :environment do
        CSS_URL_REGEX = /^(?:url\(('|")?)(.*?)(?:('|")?\))$/

        custom_image_legends = Carto::Legend.where(type: 'custom')
        custom_image_legends_count = custom_image_legends.count

        errored = []
        puts "#{custom_image_legends_count} custom image legends..."
        custom_image_legends.each_with_index do |legend, index|
          if Carto::Layer.exists?(legend.layer_id)
            legend[:definition][:categories].each_with_index do |cat, index|
              icon = cat[:icon]
              match = icon && CSS_URL_REGEX.match(icon)

              if match
                byebug
                legend.definition[:categories][index][:icon] = match[2]

                if !legend.save
                  errored << legend
                end
              end
            end
          end

          printf "(#{index}/#{custom_image_legends_count})"
        end

        2.times { puts }

        unless errored.empty?
          puts "Errored legend migrations (#{errored.count}):"
          errored.each do |legend|
            puts "#{legend.id}: #{legend.errors.full_messages.join(',')}"
          end
        end
      end
    end
  end
end
