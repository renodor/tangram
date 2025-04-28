# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_04_28_134818) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_stat_statements"
  enable_extension "plpgsql"

  create_table "patterns", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "pun"
    t.integer "order"
  end

  create_table "polygons", force: :cascade do |t|
    t.integer "shape", null: false
    t.float "points", default: [], null: false, array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "solution_id", null: false
    t.index ["solution_id"], name: "index_polygons_on_solution_id"
  end

  create_table "solutions", force: :cascade do |t|
    t.bigint "pattern_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pattern_id"], name: "index_solutions_on_pattern_id"
  end

  create_table "solved_patterns", force: :cascade do |t|
    t.bigint "pattern_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pattern_id"], name: "index_solved_patterns_on_pattern_id"
    t.index ["user_id"], name: "index_solved_patterns_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "first_time_login", default: true
    t.boolean "admin", default: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "polygons", "solutions"
  add_foreign_key "solutions", "patterns"
  add_foreign_key "solved_patterns", "patterns"
  add_foreign_key "solved_patterns", "users"
end
