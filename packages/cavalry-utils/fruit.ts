import { TeamFruit, visitFruitTree } from '@uranplus/cavalry-sdk'
import { Fruit } from '@uranplus/cavalry-define'
import { saveJsonToDb, search } from './es-service'
import * as bodybuilder from 'bodybuilder'

const maxSize = 10000
export async function saveFruitsToDb(teamFruits: TeamFruit[], index, type) {
    let entries: Fruit[] = []
    await visitFruitTree(teamFruits, (fruit: Fruit) => {
        entries.push(fruit.cloneFruit())
    })
    await saveJsonToDb(entries, index, type)
}

export async function loadTeamFruitsFromDb(
    team: string,
    manager: string,
    month: string,
    fruit_slices_index: string,
    fruit_slices_type: string
): Promise<Fruit[]> {
    const query = bodybuilder()
        .filter('term', 'staffPosition.team', team)
        .filter('term', 'staffPosition.manager', manager)
        .filter('term', 'month', month)
        .size(maxSize)
        .build()
    return await search(fruit_slices_index, fruit_slices_type, query)
}
