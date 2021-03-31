FactoryBot.define do
  to_create(&:save)

  factory :search_tweet, class: Carto::SearchTweet do
    table_id         { '96a86fb7-0270-4255-a327-15410c2d49d4' }
    data_import_id   { '96a86fb7-0270-4255-a327-15410c2d49d4' }
    service_item_id  { '555' }
    retrieved_items  { 0 }
    state            { Carto::SearchTweet::STATE_COMPLETE }
  end
end
