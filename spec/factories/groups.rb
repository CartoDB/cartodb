# encoding: utf-8

FactoryGirl.define do

  factory :carto_group, :class => Carto::Group do
    name 'A Group'
    database_role 'database_role'
  end

end
