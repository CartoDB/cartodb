# app/views/sitemaps/index.xml.builder
xml.urlset(xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9") do
  @urls.each do |path|
    xml.url do
      xml.loc path[:loc]
      xml.lastmod path[:lastfreq]
    end
  end
end
