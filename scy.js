const axios = require('axios')
const cheerio = require('cheerio')
const scyUrl = 'https://img.404ol.com'
const path = '/404'
async function getSCYImg() {
    //console.log(getimgsrc(''));
   const res = await axios.get(scyUrl+path)
    const $ = cheerio.load(res.data);
    const src =  $('img.img_class')[0].attribs.src
    return scyUrl + src.slice(1)
}


module.exports = {
    getSCYImg
}
