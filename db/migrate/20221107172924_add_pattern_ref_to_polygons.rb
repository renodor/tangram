# frozen_string_literal:true

class AddPatternRefToPolygons < ActiveRecord::Migration[7.0]
  def change
    add_reference :polygons, :pattern, foreign_key: true, null: false
  end
end
