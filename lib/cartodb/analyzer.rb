require 'json'

# Parses rbtrace memory dumps
# Taken from https://samsaffron.com/archive/2015/03/31/debugging-memory-leaks-in-ruby

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

    data.group_by{|row| row["generation"]}
        .sort{|a,b| a[0].to_i <=> b[0].to_i}
        .each do |k,v|
          puts "generation #{k} objects #{v.count}"
        end
  end
end

#Analyzer.new(ARGV[0]).analyze

require 'json'
class Analyzer2
  def initialize(filename)
    @filename = filename
  end

  def analyze
for i in 1..10
bottom = 1 + (i-1)*10
top = i*10
puts "-------- #{bottom}-#{top}"
    data = []
    File.open(@filename) do |f|
        f.each_line do |line|
          parsed=JSON.parse(line)
range = bottom..top
          data << parsed if range.include?(parsed["generation"].to_i)
        end
    end
    data.group_by{|row| "#{row["file"]}:#{row["line"]}"}
        .sort{|a,b| b[1].count <=> a[1].count}
        .each do |k,v|
          puts "#{k} * #{v.count}"
        end
end
  end
end

Analyzer2.new(ARGV[0]).analyze
