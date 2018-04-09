namespace :cartodb do
  desc "fixes duplicated unique overlays"
  task :fix_unique_overlays => :environment do
    overlays = Carto::Overlay.where(type: Carto::Overlay::UNIQUE_TYPES)

    overlays.each do |o|
      dup_overlays = Carto::Overlay.where(visualization_id: o.visualization_id, type: o.type)

      if dup_overlays.count > 1
        dup_overlays.order("overlays.order DESC").slice(1..dup_overlays.count).each(&:destroy)
      end
    end
  end
end
