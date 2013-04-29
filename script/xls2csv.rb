require 'rubygems'
require 'roo'

if ARGV[0].nil?
  puts "You should indicate a file to import"
  return -1
else
  unless File.file?(ARGV[0])
    puts "File #{ARGV[0]} not found"
    return -1
  end
  ext = File.extname(ARGV[0])
  csv_name = File.basename(ARGV[0], ext)
  s = case ext
  when '.odt'
    Openoffice.new(ARGV[0])
  when '.xls'
    Roo::Excel.new(ARGV[0])
  when '.xlsx'
    Roo::Excelx.new(ARGV[0])
  end
  s.to_csv("/tmp/#{csv_name}.csv")
  puts "/tmp/#{csv_name}.csv"
end