import { Fruit } from '@uranplus/cavalry-define'
import { TeamFruit, visitFruitTree } from './team-fruit'

export function flatTeamFruits(teamFruits: TeamFruit[], map: Map<string, Fruit[]>) {
    visitFruitTree(teamFruits, (fruit: Fruit) => {
        if (map.has(fruit.employee)) {
            map.get(fruit.employee).push(fruit)
        } else {
            map.set(fruit.employee, [fruit])
        }
    })
}
