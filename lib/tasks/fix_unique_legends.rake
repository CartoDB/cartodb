namespace :cartodb do
  desc "fixes duplicated unique legends"
  task fix_unique_legends: :environment do
    query = 'SELECT layer_id, count(*) from legends group by layer_id having count(*) > 1'
    ActiveRecord::Base.connection.execute(query).each do |row|
      legends = Carto::Layer.find(row['layer_id']).legends
      legends.sort_by(&:updated_at).slice(1..legends.count).each(&:destroy)
    end
  end
end
