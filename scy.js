const axios = require('axios')
const cheerio = require('cheerio')
const scyUrl = 'https://img.404ol.com'
const path = '/404'

async function getSCYImg(count = 1) {

    const srcs =await Promise.all(Array.apply(null, {length: count}).map(() => {
        return axios.get(scyUrl + path).then(res => {
            const $ = cheerio.load(res.data);
            const src = $('img.img_class')[0].attribs.src
            return scyUrl + src.slice(1)
        })
    }))
    return srcs
}
async function getSCYImgAndCode() {
const res = await axios.get(scyUrl + path)
    const $ = cheerio.load(res.data);
    const src = $('img.img_class')[0].attribs.src
    const url = scyUrl + src.slice(1)
    const code = $('#list p').text()
    return {url,code}
}
module.exports = {
    getSCYImg,
    getSCYImgAndCode
}
