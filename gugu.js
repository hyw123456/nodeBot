function translateToGugu(zh = '') {
    const zhHX16Array = Array.from(zh).map(i => {
        return i.charCodeAt()
    })
    const texts = zhHX16Array.map(i => {
        return Array.from(i.toString()).map(s => {
            if(+s){
                return String.fromCharCode(parseInt('00A4', 16)) + String.fromCharCode(parseInt('030' + s, 16))+ '古'
            }else{
                return '咕'
            }
        }).join('')
    })
    return texts.join(String.fromCharCode(parseInt('fff0', 16)))
}
function translateToZH(gugu = ''){
    const arrs = gugu.split(String.fromCharCode(parseInt('fff0', 16)))
    const result = arrs.map(i => {
        const r = i.match(/..古|咕/g)
        if(r&&r.length){
            return r.map(t => {
                if(t === '咕'){
                    return '0'
                }else{
                    const hx16 = t.charCodeAt(1).toString(16)
                    return  hx16[hx16.length-1]
                }
            }).join('')
        }else{
            return  ''
        }
    }).filter(i => i).map(i => {
        return String.fromCharCode(i)
    }).join('')
   return result
}


function translateEachOther(str = ''){
    if(str && ~str.indexOf(String.fromCharCode(parseInt('00A4', 16)))){
        return translateToZH(str)
    }else{
        return translateToGugu(str)
    }
}
module.exports = {
    translateEachOther
}
