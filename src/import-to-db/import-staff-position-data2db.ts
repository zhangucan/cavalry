import { getStaffPositionMap } from '@uranplus/cavalry-sdk'
import { saveJsonToDb, search } from '@uranplus/cavalry-utils'

export async function saveStaffPosition2db(index, type) {
    let staffPositionMap = await getStaffPositionMap()
    let arr = []
    let temp = [...staffPositionMap.values()].forEach(a => {
        arr = arr.concat(a)
    })
    await saveJsonToDb(arr, index, type)
}
