require 'json'

# Parses rbtrace memory dumps
# Taken from https://samsaffron.com/archive/2015/03/31/debugging-memory-leaks-in-ruby

class Analyzer1
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

class Analyzer2
  def initialize(filename)
    @filename = filename
  end

  def analyze_all
    for g in 0..20
      puts "\n\n#{g}\n"
      analyze(g)
    end
  end

  def analyze(generation)
    data = []
    File.open(@filename) do |f|
        f.each_line do |line|
          parsed=JSON.parse(line)
          data << parsed if parsed["generation"] == generation
        end
    end
    data.group_by{|row| "#{row["file"]}:#{row["line"]}"}
        .sort{|a,b| b[1].count <=> a[1].count}
        .each do |k,v|
          puts "#{k} * #{v.count}"
        end
  end
end
