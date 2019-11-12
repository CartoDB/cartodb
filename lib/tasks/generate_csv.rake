require 'csv'

namespace :cartodb do
  desc 'Generates random CSV files in db/fake_data'
  task 'generate_random_csv' => :environment do
    filename = "#{Rails.root}/db/fake_data/csv_file_#{rand(10)}_#{Time.now.to_i}.csv"
    CSV.open(filename, "wb") do |csv|
      columns = []
      100.times do
        columns << String.random(30)
      end
      csv << columns
      1.upto(100000) do
        columns = []
        100.times do
          columns << String.random(30)
        end
        csv << columns
        putc '.'
      end
    end
    puts "Generated file: #{filename}"
  end
end