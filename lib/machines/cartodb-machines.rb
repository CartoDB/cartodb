# coding: UTF-8

require 'state_machine'

# load machines
Dir[File.dirname(__FILE__) + '/cartodb-machines/lib/*.rb'].each {|file| require file }

