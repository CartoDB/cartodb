require 'carto/export/map_statistics'

namespace :cartodb do
  namespace :maps do
    desc 'Get CSV with all maps info'
    task map_info_csv: :environment do
      ms = Carto::Export::MapStatistics.new
      ms.run!
      puts "Here's your file: #{ms.filepath}\nThanks for coming :)"
    end
  end
end
