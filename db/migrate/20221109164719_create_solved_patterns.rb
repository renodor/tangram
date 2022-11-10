class CreateSolvedPatterns < ActiveRecord::Migration[7.0]
  def change
    create_table :solved_patterns do |t|
      t.references :pattern, foreign_key: true, null: false
      t.references :user, foreign_key: true, null: false

      t.timestamps
    end
  end
end
