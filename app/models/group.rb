# coding: UTF-8

class Group < Sequel::Model

  many_to_one :organization

end
