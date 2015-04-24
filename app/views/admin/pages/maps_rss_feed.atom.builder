atom_feed do |feed|
  feed.title(@feed_title)
  feed.updated(@feed_last_updated) if @feed_items.count > 0

  @feed_items.each do |item|
    feed.entry(item, {
                        url: CartoDB.url(self, 'public_visualizations_public_map', {id: item.id}, item.user)
                      }) do |entry|
      entry.title(item.name)
      entry.author do |author|
        author.name(item.user.username)
      end
    end
  end
end
