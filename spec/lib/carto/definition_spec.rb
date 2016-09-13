# encoding utf-8

require 'spec_helper_min'

module Carto
  module CartoCSS
    describe Definition do
      it 'handles inexesitent file paths' do
        definition = Carto::Definition.instance

        expect { definition.load_from_file(file_path: '/fake/path.json') }.to raise_error do
          'Carto::Definition: Couldn\'t read from file'
        end
      end
    end
  end
end
