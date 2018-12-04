import axios from 'axios'
let gEsUrl = null

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
export function setEsUrl(esUrl: String) {
    gEsUrl = esUrl
}
export async function saveJsonToDb(json, _index, _type) {
    while (json.length > 0) {
        let salarys = json.splice(0, 200)
        const prologue = { index: { _index, _type } }
        const bulkBody = salarys.reduce((bulkBody, salary) => {
            return bulkBody + JSON.stringify(prologue) + '\n' + JSON.stringify(salary) + '\n'
        }, '')
        await postBulk(bulkBody)
    }
}

async function postBulk(body) {
    return await axios({
        method: 'POST',
        url: gEsUrl + '/_bulk',
        headers: { 'content-type': 'application/json' },
        data: body,
    }).catch(err => {
        if (err.response && err.response.data && err.response.data.status && err.response.data.status === 429) {
            console.log('postBulk() retry after 500ms')
            return delay(500).then(() => postBulk(body))
        }
        console.log('postBulk() error, resp body:\n', getErrorMessage(err))
    })
}
export async function del(index: string, type: string, query) {
    await axios({
        method: 'POST',
        url: `${gEsUrl}/${index}/${type}/_delete_by_query`,
        headers: { 'content-type': 'application/json' },
        data: query,
    })
}
export async function search(_index, _type, query) {
    let url = `${gEsUrl}/${_index}/${_type}/_search`
    return await axios({
        method: 'POST',
        url,
        data: query,
    })
        .then(resp => {
            if (resp && resp.data && resp.data.hits && resp.data.hits.hits && resp.data.hits.hits[0]) {
                return resp.data.hits.hits.map(doc =>
                    Object.assign(doc._source, {
                        _index: doc._index,
                        _type: doc._type,
                        _id: doc._id,
                    })
                )
            } else {
                return []
            }
        })
        .catch(err => {
            console.log('loadJsonFromDb() error, resp body:\n', getErrorMessage(err))
        })
}
export async function loadJsonFromDb(_index, _type, size, query = null, sort = null) {
    let url = gEsUrl + '/' + _index + '/' + _type + '/_search?size=' + size
    if (sort) {
        url = url + '&sort=' + encodeURI(sort)
    }
    if (query) {
        url = url + '&q=' + encodeURI(query.key) + ':"' + encodeURI(query.value) + '"'
    }
    console.log('loadJsonFromDb() url=', url)
    return await axios({
        method: 'GET',
        url,
    })
        .then(resp => {
            if (resp && resp.data && resp.data.hits && resp.data.hits.hits && resp.data.hits.hits[0]) {
                return resp.data.hits.hits.map(doc =>
                    Object.assign(doc._source, {
                        _index: doc._index,
                        _type: doc._type,
                        _id: doc._id,
                    })
                )
            } else {
                return []
            }
        })
        .catch(err => {
            console.log('loadJsonFromDb() error, resp body:\n', getErrorMessage(err))
        })
}

function getErrorMessage(err) {
    if (err && err.response && err.response.data && err.response.data.error) {
        return err.response.data.error
    } else if (err && err.response && err.response.data) {
        return err.response.data
    } else if (err && err.response) {
        return err.response
    } else {
        return err
    }
}
