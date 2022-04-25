import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import UserPlaylist from 'App/Models/UserPlaylist'

export default class MusicController {
  public async savePlaylist({ request, response, auth }: HttpContextContract) {
    const fs = require('fs')
    const { playlistName } = request.all()
    const user = await auth.user
    const playlist = await UserPlaylist.query()
      .where('user_id', user?.id)
      .where('playlist_name', playlistName)
      .first()

    if (playlist) {
      return response.status(400).json({
        playlist,
        error: 'Playlist already exists',
      })
    }

    // Save the playlist as json file inside user_datas folder
    const playlistPath = Application.makePath('user_datas')
    const playlistFilePath = `${user?.id}_${String(playlistName)
      .replace(' ', '_')
      .toLowerCase()}.json`

    if (!fs.existsSync(playlistPath)) {
      fs.mkdirSync(playlistPath)
    }

    fs.writeFileSync(
      `${playlistPath}/${playlistFilePath}`,
      JSON.stringify(
        {
          playlistName: playlistName,
          items: [],
        },
        null,
        2
      )
    )

    const newPlaylist = await UserPlaylist.create({
      userId: user?.id,
      playlistName: playlistName,
      path: playlistFilePath,
    })

    return response.json({
      newPlaylist,
    })
  }

  public async fetchPlaylists({ request, response, auth }: HttpContextContract) {
    const user = await auth.user
    const playlists = await UserPlaylist.query().where('user_id', user?.id)
    return response.json({
      playlists,
    })
  }

  public async addMusicToPlaylist({ request, response, auth }: HttpContextContract) {
    const fs = require('fs')
    const { playlistName, id, music } = request.all()
    const user = await auth.user
    const playlist = await UserPlaylist.query()
      .where('user_id', user?.id)
      .where('playlist_name', playlistName)
      .where('id', id)
      .first()

    if (!playlist) {
      return response.status(400).json({
        playlist,
        error: 'Playlist does not exist',
      })
    }

    const playlistPath = Application.makePath('user_datas')
    const playlistFilePath = `${user?.id}_${String(playlistName)
      .replace(' ', '_')
      .toLowerCase()}.json`

    const playlistData = JSON.parse(fs.readFileSync(`${playlistPath}/${playlistFilePath}`, 'utf8'))

    playlistData.items.push(music)

    fs.writeFileSync(`${playlistPath}/${playlistFilePath}`, JSON.stringify(playlistData, null, 2))

    return response.json({
      playlist,
    })
  }
}
