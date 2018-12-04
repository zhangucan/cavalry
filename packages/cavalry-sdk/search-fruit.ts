import { Fruit, StaffPosition } from '@uranplus/cavalry-define'
import { TeamFruit, visitFruitTree } from './team-fruit'
import { GroupFruit } from './group-fruit'
import { StaffFruit } from './staff-fruit'
import { getSampleUnixTime, filterSortedTimeRangesByTime } from './tree-life'
import { assert } from 'chai'

export async function searchStaffFruits(
    teamFruits: TeamFruit[],
    staffPosition: StaffPosition,
    keys: string[]
): Promise<StaffFruit[]> {
    let staffFruits: StaffFruit[] = []
    await visitFruitTree(teamFruits, (staffFruit: StaffFruit) => {
        if (keys.every(key => staffFruit.staffPosition[key] == staffPosition[key])) {
            staffFruits.push(staffFruit)
        }
    })
    let filteredStaffFruits = filterSortedTimeRangesByTime(
        staffFruits.sort((sp1, sp2) => getSampleUnixTime(sp1) - getSampleUnixTime(sp2)),
        staffPosition.start,
        staffPosition.end
    )
    return filteredStaffFruits
}

export async function findStaffFruit(teamFruits: TeamFruit[], staffPosition: StaffPosition) {
    let staffFruit: StaffFruit = null
    staffFruit = findStaffFruitByLevel(teamFruits, staffPosition)
    if (!staffFruit) {
        let staffFruits = await searchStaffFruits(teamFruits, staffPosition, ['name', 'team', 'manager'])
        if (staffFruits.length !== 1) {
            console.error(
                'findStaffFruit() failed, staffPosition =',
                JSON.stringify(staffPosition),
                ' staffFruits=',
                JSON.stringify(staffFruits)
            )
        } else {
            staffFruit = staffFruits[0]
        }
    }

    return staffFruit
}

export function findStaffFruitByLevel(teamFruits: TeamFruit[], staffPosition: StaffPosition) {
    if (staffPosition.name === staffPosition.manager) {
        return findFruit(teamFruits, staffPosition, 'manager')
    } else if (!staffPosition.groupLeader) {
        let df: TeamFruit = findFruit(teamFruits, staffPosition, 'manager')
        return findFruit(df ? df.staffFruits : null, staffPosition, 'name')
    } else if (staffPosition.groupLeader === staffPosition.name) {
        let df: TeamFruit = findFruit(teamFruits, staffPosition, 'manager')
        return findFruit(df ? df.groupFruits : null, staffPosition, 'groupLeader')
    } else {
        let df: TeamFruit = findFruit(teamFruits, staffPosition, 'manager')
        let gf: GroupFruit = findFruit(df ? df.groupFruits : null, staffPosition, 'groupLeader')
        return findFruit(gf ? gf.staffFruits : null, staffPosition, 'name')
    }
}

export function findFruit(fruits: Fruit[], staffPosition: StaffPosition, level): any {
    if (!(fruits instanceof Array)) {
        return null
    }
    let dps: Fruit[] = filterSortedTimeRangesByTime(
        fruits
            .filter(
                fruit =>
                    fruit.staffPosition[level] === staffPosition[level] &&
                    fruit.staffPosition.team === staffPosition.team
            )
            .sort((sp1, sp2) => getSampleUnixTime(sp1) - getSampleUnixTime(sp2)),
        staffPosition.start,
        staffPosition.end
    )
    assert.isBelow(
        dps.length,
        2,
        'findFruit() error, found more than 1 record, staffPosition =' +
            JSON.stringify(staffPosition) +
            'dps =' +
            JSON.stringify(dps)
    )
    // if (dps.length === 0) {
    //     debug('findFruit() fruit not found! fruits=', fruits, ' staffPosition=', staffPosition)
    // }
    return dps[0]
}
