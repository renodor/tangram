# frozen_string_literal:true

class AddSolutionRefToPolygons < ActiveRecord::Migration[7.0]
  def change
    add_reference :polygons, :solution, foreign_key: true
  end
end
