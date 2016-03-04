require 'json'

# Parses rbtrace memory dumps
# Taken from https://samsaffron.com/archive/2015/03/31/debugging-memory-leaks-in-ruby
# Instructions:
# 0.- Prepare your local environment for production mode (since it should be more faithful):
#     Add `SslRequirement.disable_ssl_check = true` to `config/environments/production.yml`.
#     Edit `config/initializers/carto_db.rb` making `use_https?` return `false`.
# 1.- Start server in production mode enabling memory profiling:
#       `MEMORY_REPORTING=true RAILS_ENV=production bundle exec rails s -p 3000`
#     DO NOT run with MEMORY_REPORTING=true in production environments
# 2.- Use the features that you want to profile as much as possible.
# 3.- Memory dump. Find server PID and request the dump:
#       `ps xah | grep ruby`, for example
#       `bundle exec rbtrace -p <PID> -e 'Thread.new{CartoDB::memory_dump("/tmp/dump")}'`
# 4.- Run the Analyzer to get some insights about objects:
#       `ruby lib/cartodb/analyzer.rb /tmp/dump > /tmp/dump.analysis.csv`

require 'json'
class Analyzer
  def initialize(filename)
    @filename = filename
  end

  def analyze
    data = []
    File.open(@filename) do |f|
      f.each_line do |line|
        data << (parsed=JSON.parse(line))
      end
    end

    data.group_by { |row| row["generation"] }
        .sort { |a, b| a[0].to_i <=> b[0].to_i }
        .each do |k, v|
          puts "generation #{k} objects #{v.count}"
        end
  end
end

class Analyzer2
  def initialize(filename)
    @filename = filename
  end

  def analyze
    (1..10).each do |i|
      bottom = 1 + (i - 1) * 10
      top = i * 10
      puts "-------- #{bottom}-#{top}"
      data = []
      File.open(@filename) do |f|
        f.each_line do |line|
          parsed=JSON.parse(line)
          range = bottom..top
          data << parsed if range.include?(parsed["generation"].to_i)
        end
      end
      data.group_by { |row| "#{row['file']}:#{row['line']}" }
          .sort { |a, b| b[1].count <=> a[1].count }
          .each do |k, v|
            puts "#{k} * #{v.count}"
          end
    end
  end
end

class AnalyzerClasses
  def initialize(filename)
    load(filename)
  end

  def load(filename)
    @classes = {}
    File.open(filename + '.classes') do |f|
      @classes = JSON.load(f)
    end

    @data = []
    File.open(filename + '.dump') do |f|
      f.each_line do |line|
        @data << JSON.parse(line)
      end
    end
  end

  def analyze
    @data.group_by { |row| "#{row['type']}:#{row['class']}" }.each do |_, v|
      memsize = v.inject(0) { |s, x| s + x['memsize'].to_i }
      class_name = v[0]['class'].nil? ? '' : @classes[(v[0]['class'].hex / 2).to_s]
      puts "#{v[0]['type']},#{v[0]['class']},#{class_name},#{v.count},#{memsize}"
    end
  end
end

AnalyzerClasses.new(ARGV[0]).analyze
