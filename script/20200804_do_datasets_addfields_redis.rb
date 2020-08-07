#!/usr/bin/env ruby

$users_metadata.keys('do:*:datasets').each do |k|
  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)
  datasets.each do |d|
    d[:status] = 'active'
  end
  $users_metadata.hmset(k, :bq, datasets.to_json)
end