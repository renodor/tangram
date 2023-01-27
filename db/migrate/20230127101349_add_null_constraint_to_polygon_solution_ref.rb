# frozen_string_literal:true

class AddNullConstraintToPolygonSolutionRef < ActiveRecord::Migration[7.0]
  def change
    change_column_null :polygons, :solution_id, false
  end
end
