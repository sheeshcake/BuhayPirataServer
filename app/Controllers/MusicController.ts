import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Playlist from 'App/Models/Playlist'

export default class MusicController {
  public async savePlaylist({ request, response, auth }: HttpContextContract) {
    const { playlistName } = request.all()
    const user = await auth.user
    const playlist = await Playlist.find({
      where: {
        playlistName,
        userId: user?.id,
      },
      defaults: {
        playlistName,
        userId: user?.id,
      },
    })
    return response.json({
      playlist,
    })
  }
}
