const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const fs = require('fs')
let i = 0
let pageRange = 4

getTopPages((pages) => {
  async.map(pages, (page, callback) => {
    getPosts(page, (posts) => {
      callback(null, posts)
    })
  }, (err, results) => {
    const posts = [].concat.apply([], results)
    async.map(posts, (post, callback) => {
      getImages(post, (images) => {
        callback(null, images)
      })
    }, (err, results) => {
      const images = [].concat.apply([], results).map((image)=>{
        return 'https://' + image + '.jpg'
      })
      async.map(images, (image, callback) => {
        i += 1
        const file = fs.createWriteStream(`${i}.jpg`)
        request(image).pipe(file)
      })
    })
  })
})

function getTopPages(callback) {
  request('https://www.ptt.cc/bbs/Beauty/index.html', (err, res, body) => {
    const $ = cheerio.load(body)
    const prev = $('.btn-group-paging a').eq(1).attr('href').match(/\d+/)[0]
    const pageList = []
    let i
    pageList.push('')
    for (i = 0; i < pageRange - 1; i += 1) {
      pageList.push(prev - i)
    }
    callback(pageList)
  })
}

function getPosts(page, callback) {
  request(`https://www.ptt.cc/bbs/Beauty/index${page}.html`, (err, res, body) => {
    const $ = cheerio.load(body)
    const posts = $('.r-ent a').map((index, obj) => {
      return $(obj).attr('href')
    }).get()
    callback(posts)
  })
}

function getImages(post, callback) {
  request('https://www.ptt.cc' + post, (err, res, body) => {
    let images = body.match(/imgur.com\/[0-9a-zA-Z]{7}/g);
    images = [ ...new Set(images) ]
    callback(images);
  })
}