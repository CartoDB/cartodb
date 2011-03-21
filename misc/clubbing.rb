require 'rubygems'
require 'oauth'
require 'uri'
require 'net/http'
require "net/https"
require 'json'

# Application API key and secret
key = 'Tbz19YFWMdC7PraIG6mT5kwdqJeSNxJJIcPrJFdY'
secret = 'oIP8W9aSGYB4IVDsaWpYjzWW4s0covsNRRwOkIX0'

# Set a new consumer
consumer = OAuth::Consumer.new(key, secret, :site => "https://api.cartodb.com")
# Set a new request_token
request_token = consumer.get_request_token

# Read redirect url from the location header
# get authorize_url
uri = URI.parse(request_token.authorize_url)
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE
request = Net::HTTP::Post.new(uri.request_uri, {'authorize' => '1', 'oauth_token' => request_token.token})
# perform request to authorize_url
res = http.request(request)
# read location header
url = URI.parse(res.header['location'])
# get the verifier from the url
verifier = url.query.split('&').select{ |q| q =~ /^oauth_verifier/}.first.split('=')[1]

# Get an access token with the verifier
access_token = request_token.get_access_token(:oauth_verifier => verifier)


# Get the clubs
url = URI.parse("http://www.clubbingspain.com/webservices/ws_eventos.php")
req = Net::HTTP::Get.new(url.path)
res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
json = JSON.parse(res.body)

# Our table_id in cartodb
table_name = "clubradar"

json.each do |row|
  # Set a new row that aggregates all the location information
  row['direccion_completa'] = "#{row['direccion']},#{row['poblacion']},#{row['provincia']},#{row['pais']}"

  # Georeference that address, getting a latitude and a longitude
  url = URI.parse("http://maps.google.com/maps/api/geocode/json?address=#{CGI.escape(row['direccion_completa'])}&sensor=false")
  req = Net::HTTP::Get.new(url.request_uri)
  res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
  json_googlemaps = JSON.parse(res.body)
  lat = nil
  lon = nil
  begin
    lon = json_googlemaps['results'][0]['geometry']['location']['lng']
    lat = json_googlemaps['results'][0]['geometry']['location']['lat']
    row.merge!(:the_geom => %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}})
  rescue
  end

  # Query to CartoDB for the current id_evento
  res = access_token.get("/v1?sql=#{CGI.escape("select cartodb_id from clubradar where id_evento=#{row['id_evento']}")}")
  parsed_response = JSON.parse(res.body)
  # If not exists
  if parsed_response['total_rows'].to_i == 0
    puts "Inserting event #{row['id_evento']}..."
    res = access_token.post("/v1/tables/#{table_name}/records", row)
  else #exists
    row_id = parsed_response['rows'][0]['cartodb_id']
    puts "Updating id #{row_id}..."
    res = access_token.put("/v1/tables/#{table_name}/records/#{row_id}", row)
  end
end
