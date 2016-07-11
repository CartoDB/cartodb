namespace :cartodb do
  namespace :blog do
    desc 'Get last posts'
    task :get_last_posts => :environment do
      # <div class="block">
      #   <h3>Latest from the blog</h3>
      #   <h4><a href="#">World Database on Protected Areas</a></h4>
      #   <p>ProtectedPlanet.net hosts information on over 130,000 protected areas in a distributed CartoDB infrastructure.  The UN Environment Programme is turning to the wiki-world in an attempt to... <a href="#">Read more</a></p>
      # </div>
      # <div class="block">
      #   <h3></h3>
      #   <h4><a href="#">GROMS Migration data on CartoDB</a></h4>
      #   <p>The Global Registry of Migratory Species summarizes knowledge about Migratory Species for conservation. The old database was developed in Access and had the geospatial information attached as... <a href="#">Read more</a></p>
      # </div>
      # <div class="block last">
      #   <h3></h3>
      #   <h4><a href="#">A new status update on blog.carto.com</a></h4>
      #   <p>Wanted to give everyone an update that we’ve disabled our status blog located at temporarily while we work out all of the kinks in our two shiny new product of two brothers of the man in red... <a href="#">Read more</a></p>
      # </div>

      feed_url = "https://blog.carto.com/rss"
      doc = Nokogiri.parse(open(feed_url))
      content = ""
      items = doc.search('item')
      i = 0
      items[0..2].each do |item|
        text = item.search('description').first.inner_text.strip_tags.gsub(/^(.{150}[^\s]*)(.*)/m) {$2.empty? ? $1 : $1 + "... <a href=\"#{item.search('guid').first.inner_text}\">Read more</a>"}
        content += <<-HTML
<div class="block#{i == 2 ? ' last' : ''}">
  <h3>#{i == 0 ? "Latest from the blog" : ''}</h3>
  <h4><a href="#{item.search('guid').first.inner_text}" >#{item.search('title').first.inner_text.truncate(60)}</a></h4>
  <p>#{text}</p>
</div>
HTML
        i+=1
      end
      fd = File.open(CartoDB::LAST_BLOG_POSTS_FILE_PATH, 'w+')
      fd.write(content)
      fd.close
    end
  end
end
