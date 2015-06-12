xml.instruct! :xml, :version => '1.0'
xml.rss :version => "2.0" do
  xml.channel do
    xml.title @feed_title
    xml.description @feed_description
    xml.link CartoDB.url(self, 'public_datasets_home')

    @feed_items.each do |feed|
      xml.item do
        xml.title feed.name
        xml.description feed.description_html_safe
        xml.pubDate Time.parse(feed.created_at.to_s).rfc822()
        xml.link CartoDB.url(self, 'public_table_map', {id: feed.id}, feed.user)
        xml.guid CartoDB.url(self, 'public_table_map', {id: feed.id}, feed.user)
      end
    end
  end
end

