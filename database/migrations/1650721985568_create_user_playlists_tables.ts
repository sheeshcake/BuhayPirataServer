import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateUserPlaylistsTables extends BaseSchema {
  protected tableName = 'user_playlists'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.bigInteger('user_id').unsigned().notNullable()
      table.string('playlist_name').notNullable()
      // file path of the referenced playlist
      table.string('path').notNullable()

      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
