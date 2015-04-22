xml.instruct! :xml, :version => '1.0'
xml.rss :version => "2.0" do
  xml.channel do
    xml.title "user's map feed"
    xml.description "RSS feed of user's CartoDB maps"
    xml.link "http://username.cartodb.com"

    #@maps.each do |map|
      #xml.item do
        #xml.title ""
        #xml.description "Map description"
        #xml.pubDate Time.parse(map.created_at.to_s).rfc822()
        #xml.link "http://link_to_the_map"
        #xml.guid "http://link_to_the_map"
      #end
    #end
  end
end

