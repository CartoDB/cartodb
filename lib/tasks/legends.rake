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
        include Carto::MapcappedVisualizationUpdater

        CSS_URL_REGEX = /^(?:url\(['"]?)(.*?)(?:['"]?\))$/
        STATIC_ASSETS_REGEX = /http:\/\/com.cartodb.users-assets.production.s3.amazonaws.com(.*)/

        puts "Updating base layer urls"
        layers = Carto::Layer.joins(:legends).where(legends: { type: 'custom' })

        total = layers.count
        acc = 0
        errors = 0

        puts "Updating #{total} layers"

        layers.find_each do |layer|
          acc += 1

          puts "#{acc} / #{total}" if (acc % 100).zero?

          begin
            visualization = layer.visualization
            next unless visualization

            success = update_visualization_and_mapcap(visualization) do |vis, persisted|
              vis.data_layers.each do |l|
                acc_legend = 0

                l.legends.each do |legend|
                  acc_category = 0
                  categories = legend[:definition][:categories]

                  categories && categories.each do |category|
                    icon = category[:icon]

                    css_url_match = icon && CSS_URL_REGEX.match(icon)
                    if css_url_match
                      icon = css_url_match[1]

                      category[:icon] = icon
                    end

                    static_assets_match = icon && STATIC_ASSETS_REGEX.match(icon)
                    if static_assets_match
                      icon = "https://s3.amazonaws.com/com.cartodb.users-assets.production#{static_assets_match[1]}"

                      category[:icon] = icon
                    end

                    acc_category += 1
                  end

                  legend.save if persisted

                  acc_legend += 1
                end
              end
            end

            raise 'MapcappedVisualizationUpdater returned false' unless success
          rescue StandardError => e
            errors += 1
            STDERR.puts "Error updating layer #{layer.id}: #{e.inspect}. #{e.backtrace.join(',')}"
          end
        end

        puts "Finished. Total: #{total}. Errors: #{errors}" unless Rails.env.test?
      end
    end
  end
end
