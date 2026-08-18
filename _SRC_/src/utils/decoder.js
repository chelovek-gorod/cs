export function encode(string) {
    let result = ""
    for (let i = 0; i < string.length; i++) {
        let hex = string.charCodeAt(i).toString(16)
        result += ("000" + hex).slice(-4)
    }
    return result
}

export function decode(string) {
    let hexes = string.match(/.{1,4}/g) || [];
    let result = ""
    for(let i = 0; i < hexes.length; i++) {
        result += String.fromCharCode(parseInt(hexes[i], 16))
    }
    return result
}

/*
let testString = JSON.stringify({
    type: 'test',
    arr: [
        {
            pos:{x: 10, y: 20},
            angle: 0
        },
        {
            pos:{x: 30, y: 50},
            angle: 90
        },
    ],
    data: {name: 'x', side:'0'}
})
console.log(testString)
console.time('encoding')
testString = encode(testString)
console.timeEnd('encoding')
console.log(testString)
console.time('decoding')
testString = decode(testString)
console.timeEnd('decoding')
console.log(JSON.parse(testString))
*/