import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const WebTorrent = require('webtorrent')
const fs = require('fs')
const client = new WebTorrent()

let stats = { progress: 0, downloadSpeed: 0, ratio: 0 }
let errorMessage = ''

//
//	4.	Listen for any potential client error and update the above variable so
//		the front end can display it in the browser.
//
client.on('error', function (err) {
  errorMessage = err.message
})

client.on('download', () => {
  stats = {
    progress: Math.round(client.progress * 100 * 100) / 100,
    downloadSpeed: client.downloadSpeed,
    ratio: client.ratio,
  }
})

export default class TorrentsController {
  public async add({ request, response }: HttpContextContract) {
    const torrentPromise = new Promise((resolve, reject) => {
      const magnet = request.param('magnet')
      const torrent = client.add(magnet, (torrent) => {
        console.log('torrent done from add')
        resolve(torrent)
        return torrent
      })
    })
    const files = await torrentPromise.then((r) => {
      return r.files.map((item) => {
        return {
          name: item.name,
          length: item.length,
        }
      })
    })
    response.status(200)
    response.json(files)
  }

  public async stream({ request, response }: HttpContextContract) {
    const magnet = request.param('magnet')
    const torrent = await client.get(magnet)
    const fileName = decodeURI(request.param('file_name'))
    let file = {}
    console.log('Magnet', magnet)
    for (let i = 0; i < torrent.files.length; i++) {
      if (torrent.files[i].name === fileName) {
        const ext = fileName.split('.').pop()
        if (ext === 'mp4' || ext === 'mkv' || ext === 'avi') {
          file = torrent.files[i]
          break
        }
      }
    }
    const range = request.headers().range
    console.log('range', range)

    if (!range) {
      console.log('no range')
      response.status(416).send('Requested Range Not Satisfiable')
    }

    let positions = range.replace(/bytes=/, '').split('-')
    let start = parseInt(positions[0], 10)
    let fileSize = file.length
    let end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1
    let chunksize = end - start + 1
    response.header('Content-Type', 'video/mp4')
    response.header('Content-Length', chunksize)
    response.header('Content-Range', 'bytes ' + start + '-' + end + '/' + fileSize)
    response.header('Accept-Ranges', 'bytes')
    response.status(206)
    let streamPosition = {
      start: start,
      end: end,
    }
    let stream = file.createReadStream(streamPosition)

    response.stream(stream)
  }

  public async list({ request, response }: HttpContextContract) {
    let torrent = client.torrents.reduce(function (array, data) {
      array.push({
        hash: data.infoHash,
      })

      return array
    }, [])

    response.json(torrent)
  }

  public async stats({ request, response }: HttpContextContract) {
    response.json(stats)
  }

  public async error({ request, response }: HttpContextContract) {
    response.status(200)
    response.json(errorMessage)
  }

  public async remove({ request, response }: HttpContextContract) {
    const magnet = request.param('magnet')
    client.remove(magnet)
    response.status(200)
    response.json({ message: 'Torrent removed' })
  }
}
