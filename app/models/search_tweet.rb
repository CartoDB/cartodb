# encoding: UTF-8'

class SearchTweet < Sequel::Model

  many_to_one :user
  many_to_one :table

end