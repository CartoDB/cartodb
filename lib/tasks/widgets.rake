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
          widget.update_attribute(:source_id, source)
        elsif layer.visualization
          # Create source analyses and set as widget source
          widget.visualization.add_source_analyses
          layer.reload
          widget.update_attribute(:source_id, layer.options[:source])
        else
          # Orphan layer
          widget.destroy
        end
      end
    end
  end
end
