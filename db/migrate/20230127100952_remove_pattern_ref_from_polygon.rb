# frozen_string_literal:true

class RemovePatternRefFromPolygon < ActiveRecord::Migration[7.0]
  def change
    remove_reference :polygons, :pattern, foreign_key: true, null: false
  end
end
