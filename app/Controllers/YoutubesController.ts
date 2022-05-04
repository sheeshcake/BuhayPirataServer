import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const ytdl = require('ytdl-core')
// Youtube search libraries
const ytsr = require('ytsr')

export default class YoutubesController {
  public async search({ request, response }: HttpContextContract) {
    console.log(request.input('name'))
    // search for a video
    const filters = await ytsr.getFilters(request.input('name'))
    const filter = filters.get('Type').get('Video')
    await ytsr(filter.url).then((r) => {
      return response.json(
        r.items.slice(0, 8).map((item) => {
          return {
            title: item.title,
            url: item.url,
            thumbnail: item.bestThumbnail.url,
            id: item.id,
            // additional_data: item,
            uploadedAt: item.uploadedAt,
            duration: item.duration,
            author: item.author.name,
          }
        })
      )
    })
  }

  public async play({ request, response }: HttpContextContract) {
    // Download youtube video and stream it
    const videoId = request.param('videoId')

    const videoInfo = await ytdl.getInfo(videoId)

    let audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      filter: 'audioonly',
      quality: 'highestaudio',
    })
    response.json({
      title: videoInfo.videoDetails.title,
      thumbnail: videoInfo.videoDetails.thumbnails[0].url,
      url: audioFormat.url,
      videoId: videoId,
      ytlink: videoInfo.videoDetails.video_url,
    })
  }
}
