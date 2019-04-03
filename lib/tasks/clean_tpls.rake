namespace :cartodb do
  namespace :db do

    #################
    # CLEAN REDIS CACHE FOR VISUALIZATIONS
    #################
    desc 'Clean redis cache for visualizations'
    task :clean_viz => :environment do
      Carto::Visualization.where(type: ['derived', 'table']).find_each{
        |v| Carto::VisualizationInvalidationService.new(v).invalidate }
    end
  end
end

