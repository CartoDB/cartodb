# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe Definition do
    before (:all) { @definition = Carto::Definition.instance }
    after  (:all) { @definition = nil }

    it 'handles inexesitent file paths' do
      expect { @definition.load_from_file('/fake/path.json') }.to raise_error do
        'Carto::Definition: Couldn\'t read from file'
      end
    end

    it 'doesn\'t read the same file twice' do
      file_path = 'lib/assets/javascripts/builder/data/default-cartography.json'

      File.expects(:read).with(file_path).returns('{}').at_most(1)

      2.times do
        @definition.load_from_file(file_path)
      end
    end
  end
end
