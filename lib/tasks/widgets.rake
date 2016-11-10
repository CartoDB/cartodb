namespace :cartodb do
  namespace :widgets do
    desc 'fills source_id in old widgets'
    task fill_source_id: :environment do |_t, _args|
      Carto::Widget.where(source_id: nil).find_each do |widget|
        layer = widget.layer
        layer.reload
        source = layer.options[:source]
        if source
          # Set to same source as layer
          puts "Updating Widget #{widget.id} from #{widget.source_id} to #{source}"
          widget.update_attribute(:source_id, source)
        elsif layer.visualization
          # Create source analyses and set as widget source
          puts "Creating source analyses for visualization #{widget.visualization.id}"
          widget.visualization.add_source_analyses
          layer.reload
          puts "Updating Widget #{widget.id} from #{widget.source_id} to #{source}"
          widget.update_attribute(:source_id, layer.options[:source])
        else
          # Orphan layer
          puts "Destroying Widget #{widget.attributes}"
          widget.destroy
        end
      end
    end
  end
end
