namespace :cartodb do
  desc "fixes duplicated unique overlays"
  task fix_unique_overlays: :environment do
    query = <<-SQL
      select visualization_id, type from overlays
      where type in ('header', 'search', 'layer_selector', 'share', 'zoom', 'logo', 'loader', 'fullscreen')
      group by visualization_id, type having count(*) > 1
    SQL
    vis_ids = ActiveRecord::Base.connection.execute(query).values
    overlays = vis_ids.map { |i| Carto::Overlay.where(visualization_id: i[0], type: i[1]) }

    overlays.each do |o|
      o.sort! { |l, r| r.order <=> l.order }
      o.slice(1..o.count).each(&:destroy)
    end
  end
end
