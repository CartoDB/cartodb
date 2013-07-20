#!/usr/bin/env ruby

require 'open-uri'
require 'json'

old_json = JSON.parse(File.read('citybike.json'))
new_json = JSON.parse(open('http://citibikenyc.com/stations/json').read)

old_info["stationBeanList"].each do |station|
  new_info = new_json["stationBeanList"].select { |j| j["id"] == station["id"] }.first
  if station["statusValue"] != new_info["statusValue"] ||
     station["availableBikes"] != new_info["availableBikes"]
    puts "Changed #{station["stationName"]}"
  else
    puts "Unchanged #{station["stationName"]}"
  end
end

File.open("citybike.json", "w").write(new_json)