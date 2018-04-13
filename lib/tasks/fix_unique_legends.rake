namespace :cartodb do
  desc "fixes duplicated unique legends"
  task fix_unique_legends: :environment do
    query = 'SELECT layer_id, count(*) from legends group by layer_id having count(*) > 1'
    ActiveRecord::Base.connection.execute(query).each do |row|
      legends = Carto::Layer.find(row['layer_id']).legends
      legend_types = Carto::Legend::LEGEND_TYPES_PER_ATTRIBUTE.keys
      legends_per_type = legend_types.reduce({}) { |m, o| m.merge(o => []) }
      legend_per_type = legends.reduce(legends_per_type) do |m, legend|
        legend_types.reduce(m) do |m2, t|
          m2[t] << legend if Carto::Legend::LEGEND_TYPES_PER_ATTRIBUTE[t].include?(legend.type)
          m2
        end
      end
      legend_per_type.each { |_, l| l.sort_by(&:updated_at).slice(0..l.count - 2).each(&:destroy) if l.size > 1 }
    end
  end
end
