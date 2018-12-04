import * as moment from 'moment'
import * as _ from 'lodash'
import {
    StaffPosition,
    NodeSlice,
    NoneLeafNodeSlice,
    TeamSlice,
    GroupSlice,
    StaffSlice,
    JobStatus,
    PositionChange,
    Role,
    BaseDataServiceInterface,
    DIC_CAT_MAPPING,
} from '@uranplus/cavalry-define'
declare var require: any
const debug = require('debug')('tree-life')

let gBaseDataService: BaseDataServiceInterface = null

interface TimeRange {
    start?: string
    end?: string
}

let gMonth: string = null

let gInitialTeam = []

var gPhraseMapping = {
    猎头部: '猎头组',
    B03组: '招聘会',
    Q01组: '招聘会',
    Q02组: '招聘会',
    Q06: '招聘会',
    Q06组: '招聘会',
    Q07组: '招聘会',
    Q08组: '招聘会',
    Z01组: '招聘会',
    Z03组: '招聘会',
    Z04组: '招聘会',
    Z05组: '招聘会',
}
const maxSize = 99999
let gPositionChanges = null
let gTreeLife = null
let gStaffPositionMap = null
function trimString(str) {
    return str ? str.toString().trim() : null
}

export function initTreeLife(month: string, baseDataService: BaseDataServiceInterface) {
    gMonth = month
    gBaseDataService = baseDataService
}

function ensureManagerTeams(tree, ...teams) {
    teams.forEach(team => {
        if (!tree.has(team)) {
            let managerTeamSlices = new Map<string, TeamSlice[]>()
            tree.set(team, managerTeamSlices)
        }
    })
}
function ensureLeaderNodeSlices(orgTree: Map<string, NodeSlice[]>, ...leaders) {
    leaders.forEach(leader => {
        if (!orgTree.has(leader)) {
            orgTree.set(leader, [new NodeSlice(null, null)])
        }
    })
}

function ensureSubSliceTreeAndStaffTree(slice: NoneLeafNodeSlice) {
    if (slice.subSliceTree == undefined) {
        slice.subSliceTree = new Map<string, GroupSlice[]>()
    }
    if (slice.staffTree == undefined) {
        slice.staffTree = new Map<string, StaffSlice[]>()
    }
}

function isSignificantChange(change: PositionChange) {
    if (
        change.previous.position === '项目经理' &&
        change.current.position === '项目经理' &&
        change.previous.team == change.current.team
    ) {
        return false
    } else if (
        change.previous.title === change.current.title &&
        change.previous.position === change.current.position &&
        change.previous.team === change.current.team &&
        change.previous.leader === change.current.leader
    ) {
        // ignore previous
        change.previous = {}
        return true
    } else {
        return true
    }
}

function isNewTeam(tree: Map<string, Map<string, TeamSlice[]>>, team, date) {
    if (tree.has(team)) {
        if (tree.get(team).size === 0) {
            return true
        } else {
            chooseCloseSliceByDate(_.flatten([...tree.get(team).values()]), date, 10)
            debug('isNewTeam() filter team:', team)
            return false
        }
    } else {
        return false
    }
}

function setTeamSliceNodes(tree: Map<string, Map<string, TeamSlice[]>>, positionChanges: PositionChange[]) {
    positionChanges
        .filter(
            change =>
                (change.previous.position === '项目经理' || change.current.position === '项目经理') &&
                isSignificantChange(change)
        )
        .forEach(change => {
            ensureManagerTeams(tree, change.previous.team, change.current.team)
            if (
                change.previous.position === '项目经理' &&
                change.current.position === '项目经理' &&
                change.previous.team !== null &&
                change.current.team !== null &&
                !hasNewManager(positionChanges, change.previous.team, change.date, change.name)
            ) {
                if (isNewTeam(tree, change.current.team, change.date)) {
                    debug(
                        '项目改名, change: ' +
                            change.name +
                            ',' +
                            change.previous.team +
                            ',' +
                            change.current.team +
                            ',' +
                            change.date
                    )
                    let slice: TeamSlice = setTreeNode(tree.get(change.current.team), change, 'current')
                    let oldSlice: any = chooseTheSliceByDate(
                        tree.get(change.previous.team).get(change.name),
                        change.date
                    )
                    slice.department = change.current.department
                    slice.oldName = change.previous.team
                    slice.link = oldSlice
                    slice._start = change.date
                    if (oldSlice != null) {
                        oldSlice.nameEnd = change.date
                        oldSlice.newName = change.current.team
                    }
                    return
                } else {
                    let oldSlice: TeamSlice = chooseTheSliceByDate(
                        tree.get(change.previous.team).get(change.name),
                        change.date
                    )
                    if (change.date === '2018-06-15' && change.name === '陈向飞') {
                        debug('setTeamSliceNodes() oldSlice=', oldSlice)
                    }
                    if (oldSlice && oldSlice.oldName === change.current.team) {
                        // 处理 A=>B B=>A 的情况，直接断掉环形结构
                        //TODO 多别名循环

                        // oldSlice.end = change.date
                        let slice: TeamSlice = setTreeNode(tree.get(change.current.team), change, 'current')

                        slice.department = change.current.department
                        slice.oldName = change.previous.team
                        slice.link = oldSlice
                        slice._start = change.date
                        oldSlice.nameEnd = change.date
                        oldSlice.newName = change.current.team
                        return
                    }
                }
            }
            if (change.previous.position === '项目经理') {
                let slice: TeamSlice = setTreeNode(tree.get(change.previous.team), change, 'previous')
                slice.department = change.previous.department
            }
            if (change.current.position === '项目经理') {
                let slice: TeamSlice = setTreeNode(tree.get(change.current.team), change, 'current')
                slice.department = change.current.department
            }
        })
}

function getDiffTime(nodeSlice: NodeSlice, date) {
    let diffTimeLeft = Math.abs(moment(nodeSlice.start).unix() - moment(date).unix())
    let diffTimeRight = Math.abs(moment(nodeSlice.end).unix() - moment(date).unix())
    return diffTimeLeft < diffTimeRight ? diffTimeLeft : diffTimeRight
}

export function chooseCloseSliceByDate(nodeSlices: NoneLeafNodeSlice[], date, minDays) {
    let minDiffTime = Number.MAX_SAFE_INTEGER
    let minSlice = null

    for (let nodeSlice of filterNodeSlices(nodeSlices)) {
        if (
            (!nodeSlice.start || moment(nodeSlice.start).isSameOrBefore(moment(date))) &&
            (!nodeSlice.end || moment(nodeSlice.end).isAfter(moment(date)))
        ) {
            return nodeSlice
        }
        let diffTime = getDiffTime(nodeSlice, date)
        if (diffTime < minDiffTime) {
            minDiffTime = diffTime
            minSlice = nodeSlice
        }
    }
    if (!!minSlice && minDiffTime / 60 / 60 / 24 < minDays) {
        debug(
            'chooseClosesSliceByDate() warn start:',
            minSlice.start,
            ' end:',
            minSlice.end,
            ' date:',
            date,
            ' diff days:',
            minDiffTime / 60 / 60 / 24
        )
        return minSlice
    }
}

function chooseTheSliceByDate(nodeSlices: NodeSlice[], date): NodeSlice {
    if (!(nodeSlices instanceof Array)) {
        return null
    }
    for (const nodeSlice of filterNodeSlices(nodeSlices)) {
        if (
            (!nodeSlice.start || moment(nodeSlice.start).isSameOrBefore(moment(date))) &&
            (!nodeSlice.end || moment(nodeSlice.end).isSameOrAfter(moment(date)))
        ) {
            return nodeSlice
        }
    }
}

function getNodeByDate(nodeSlices: NoneLeafNodeSlice[], date) {
    return chooseCloseSliceByDate(nodeSlices, date, 7)
}

function setTreeNode(tree: Map<string, NodeSlice[]>, change: PositionChange, side = null): NodeSlice {
    if (!side || side === 'previous') {
        if (tree.has(change.name)) {
            const nodeSlices = tree.get(change.name)
            const nodeSlice = nodeSlices[nodeSlices.length - 1]
            nodeSlice.end = change.date
            nodeSlice.status = change.status
            return nodeSlice
        } else {
            tree.set(change.name, [
                new NodeSlice(null, change.date, Role[change.previous.title], change.previous.position, change.status),
            ])
            return tree.get(change.name)[0]
        }
    }
    if (!side || side === 'current') {
        if (tree.has(change.name)) {
            let nodeSlices = tree.get(change.name)
            if (
                // nodeSlices[nodeSlices.length - 1].end === change.date ||
                nodeSlices[nodeSlices.length - 1].end == null &&
                nodeSlices[nodeSlices.length - 1].nameEnd == null
            ) {
                // nodeSlices[nodeSlices.length - 1].end = null
                return nodeSlices[nodeSlices.length - 1]
            } else {
                nodeSlices.push(
                    new NodeSlice(change.date, null, Role[change.current.title], change.current.position, change.status)
                )
                return nodeSlices[nodeSlices.length - 1]
            }
        } else {
            tree.set(change.name, [
                new NodeSlice(change.date, null, Role[change.current.title], change.current.position, change.status),
            ])
            return tree.get(change.name)[0]
        }
    }
}

function setGroupSliceNodes(tree: Map<string, Map<string, TeamSlice[]>>, positionChanges: PositionChange[]) {
    positionChanges
        .filter(
            change =>
                (change.previous.title === DIC_CAT_MAPPING.ZJ.ZG.name ||
                    change.current.title === DIC_CAT_MAPPING.ZJ.ZG.name) &&
                isSignificantChange(change)
        )
        .forEach(change => {
            ensureManagerTeams(tree, change.previous.team, change.current.team)
            ;['previous', 'current'].forEach(side => {
                if (change[side].title === DIC_CAT_MAPPING.ZJ.ZG.name) {
                    ensureLeaderNodeSlices(tree.get(change[side].team), change[side].leader)
                    const slices = tree.get(change[side].team).get(change[side].leader)

                    const slice: NoneLeafNodeSlice = getNodeByDate(slices, change.date)
                    if (slice) {
                        ensureSubSliceTreeAndStaffTree(slice)
                        setTreeNode(slice.subSliceTree, change, side)
                    } else {
                        console.error(
                            'setGroupSliceNodes() ERROR, side: ',
                            side,
                            ', team:',
                            change[side].team,
                            ' group leader:',
                            change[side].leader,
                            ' date:',
                            change.date,
                            'date not found! group:',
                            change.name
                        )
                    }
                }
            })
        })
}

function getParentSliceByDateAndLeader(
    managerTeams: Map<string, TeamSlice[]>,
    leader: string,
    date: string
): NoneLeafNodeSlice {
    for (let teamSlices of managerTeams.values()) {
        for (let teamSlice of teamSlices) {
            if (teamSlice.subSliceTree && teamSlice.subSliceTree.has(leader)) {
                let groupSlice: GroupSlice = getNodeByDate(teamSlice.subSliceTree.get(leader), date)
                if (groupSlice) {
                    return groupSlice
                }
            }
        }
    }

    if (managerTeams.has(leader)) {
        let team: TeamSlice = getNodeByDate(managerTeams.get(leader), date)
        if (team) {
            return team
        }
    }
}

function setStaffNodes(tree: Map<string, Map<string, TeamSlice[]>>, positionChanges: PositionChange[]) {
    positionChanges
        .filter(
            change =>
                (change.previous.title === DIC_CAT_MAPPING.ZJ.YG.name ||
                    change.current.title === DIC_CAT_MAPPING.ZJ.YG.name) &&
                isSignificantChange(change)
        )
        .forEach(change => {
            if (change.name === '刘雅倩' && change.date === '2018-05-28') {
                debug('setStaffNodes() with staff 刘雅倩, change=', change)
            }
            ensureManagerTeams(tree, change.previous.team, change.current.team)
            ;['previous', 'current'].forEach(side => {
                if (change[side].title === DIC_CAT_MAPPING.ZJ.YG.name) {
                    const parentSlice: NoneLeafNodeSlice = getParentSliceByDateAndLeader(
                        tree.get(change[side].team),
                        change[side].leader,
                        change.date
                    )
                    if (parentSlice) {
                        ensureSubSliceTreeAndStaffTree(parentSlice)
                        setTreeNode(parentSlice.staffTree, change, side)
                    } else {
                        debug(
                            'setStaffNodes() ERROR, side: ',
                            side,
                            ', team:',
                            change[side].team,
                            ' leader:',
                            change[side].leader,
                            ' date:',
                            change.date,
                            'date not found! name:',
                            change.name
                        )
                    }
                }
            })
        })
}

export async function getPositionChanges(): Promise<PositionChange[]> {
    if (!gPositionChanges) {
        gPositionChanges = _getPositionChanges()
    }
    return gPositionChanges
}

export function phraseMap(phrase) {
    return gPhraseMapping[phrase] ? gPhraseMapping[phrase] : phrase
}

function compatiblePatch(positionChange: PositionChange): PositionChange {
    positionChange.previous.team = phraseMap(positionChange.previous.team)
    positionChange.current.team = phraseMap(positionChange.current.team)
    return positionChange
}

async function getPositionChangesFromUnchangedEmployees(staffList: Set<string>) {
    let unchangedEmployees = (await gBaseDataService.getCurrentEmployees()).filter(
        e =>
            (!e.hireDate ||
                moment(e.hireDate) <
                    moment(gMonth)
                        .add(1, 'month')
                        .startOf('month')) &&
            !staffList.has(e.name)
    )
    return unchangedEmployees.map(e => {
        debug('getPositionChangesFromUnchangedEmployees() employee=', e)
        let pc = new PositionChange()
        pc.name = e.name
        pc.date = moment(gMonth)
            .startOf('year')
            .subtract(1, 'month')
            .format('YYYY-MM-DD')
        pc.status = JobStatus.FAKE_ENTRY
        pc.current = {}
        pc.current.team = e.team
        pc.current.department = e.department
        pc.current.leader = e.leader
        pc.current.title = e.title
        pc.current.position = e.position
        pc.current.start = pc.date
        pc.current.end = null
        pc.previous = {}
        return pc
    })
}

async function _getPositionChanges(): Promise<PositionChange[]> {
    const staffList = new Set<string>()
    let positionChanges: PositionChange[] = await gBaseDataService.getPositionChanges(gMonth)
    positionChanges.forEach(positionChange => {
        staffList.add(positionChange.name)
    })
    return positionChanges
        .concat(await getPositionChangesFromUnchangedEmployees(staffList))
        .map(pc => compatiblePatch(pc))
        .sort((a, b) => moment(a.date).unix() - moment(b.date).unix())
}

// async function _getPositionChanges_v1(): Promise<PositionChange[]> {
//     return (await loadJsonFromDb('employee_position_change', 'employee_position_change', maxSize))
//         .filter(item => !!item['异动日期'])
//         .map(
//             (item): PositionChange =>
//                 compatiblePatch({
//                     id: item._id,
//                     name: trimString(item['姓名']),
//                     date: moment(trimString(item['异动日期']), 'M/D/YY').format('YYYY-MM-DD'),
//                     previous: {
//                         team: trimString(item['原组别']),
//                         leader: trimString(item['原直接领导']),
//                         title: trimString(item['原职级']),
//                         position: trimString(item['原岗位']),
//                     },
//                     current: {
//                         team: trimString(item['新组别']),
//                         leader: trimString(item['现直接领导']),
//                         title: trimString(item['新职级']),
//                         position: trimString(item['新岗位']),
//                     },
//                 })
//         )
//         .sort((a, b) => moment(a.date).unix() - moment(b.date).unix())
// }

function setInitialTeam(tree: Map<string, Map<string, TeamSlice[]>>) {
    gInitialTeam.forEach(team => {
        ensureManagerTeams(tree, team.name)
        ensureLeaderNodeSlices(tree.get(team.name), team.manager)
    })
}

async function _getTreeLife(): Promise<Map<string, Map<string, TeamSlice[]>>> {
    let positionChanges = await getPositionChanges()
    gInitialTeam = await gBaseDataService.getInitialTeam()
    let tree = new Map<string, Map<string, TeamSlice[]>>()
    setInitialTeam(tree)
    setTeamSliceNodes(tree, positionChanges)
    setGroupSliceNodes(tree, positionChanges)
    setStaffNodes(tree, positionChanges)

    return tree
}

export async function getTreeLife(): Promise<Map<string, Map<string, TeamSlice[]>>> {
    if (!gTreeLife) {
        gTreeLife = _getTreeLife()
    }
    return gTreeLife
}

export function chopNodeSlice(nodeSlice: TimeRange, start, end) {
    if (!nodeSlice.start || moment(nodeSlice.start) < moment(start)) {
        nodeSlice.start = moment(start).format('YYYY-MM-DD')
    }
    if (!nodeSlice.end || moment(nodeSlice.end) > moment(end)) {
        nodeSlice.end = moment(end).format('YYYY-MM-DD')
    }
    // console.log('chopNodeSlice() nodeSlice=', nodeSlice)
    return nodeSlice
}

export function hasNodeSliceFit(nodeSlice: any, start, end) {
    let s = nodeSlice.start
    let e = nodeSlice.end
    if (!!start && !!end) {
        if (!nodeSlice.start || moment(nodeSlice.start) < moment(start)) {
            s = moment(start).format('YYYY-MM-DD')
        }
        if (!nodeSlice.end || moment(nodeSlice.end) > moment(end)) {
            e = moment(end).format('YYYY-MM-DD')
        }
        return moment(s) < moment(e)
    } else if (!!start) {
        if (!nodeSlice.end || moment(nodeSlice.end) > moment(start)) {
            return true
        } else {
            return false
        }
    } else if (!!end) {
        if (!nodeSlice.start || moment(nodeSlice.start) < moment(end)) {
            return true
        } else {
            return false
        }
    } else {
        return true
    }
}

function getFlagsOfNodeSlices(slices: NodeSlice[], isStrict = false) {
    let results = []
    let lastTime = null
    let bOver = false

    for (let i = slices.length - 1; i >= 0; --i) {
        if (results[i + 1] === false || bOver) {
            results.unshift(false)
        } else {
            let slice = slices[i]
            if (slice.end == null) {
                if (lastTime == null) {
                    results.unshift(true)
                    if (slice.start == null) {
                        bOver = true
                    } else {
                        lastTime = slice.start
                    }
                } else {
                    results.unshift(false)
                }
            } else {
                if (lastTime == null) {
                    results.unshift(true)
                    lastTime = slice.start
                } else {
                    if (isStrict ? slice.end === lastTime : moment(slice.end).isSameOrBefore(moment(lastTime))) {
                        if (slice.start == null) {
                            results.unshift(true)
                            bOver = true
                        } else if (moment(slice.start).isSameOrBefore(moment(slice.end))) {
                            results.unshift(true)
                            lastTime = slice.start
                        } else {
                            results.unshift(false)
                        }
                    } else {
                        results.unshift(false)
                    }
                }
            }
        }
    }

    return results
}

export function validateNodeSlices(slices: NodeSlice[], isStrict = false): boolean {
    let flags = getFlagsOfNodeSlices(slices, isStrict)
    return flags.every(flag => flag)
}
function filterNodeSlices(slices: NodeSlice[]): NodeSlice[] {
    if (!(slices instanceof Array)) {
        return null
    }
    let flags = getFlagsOfNodeSlices(slices)
    const validSlice = slices.filter((slice, i) => flags[i])
    if (validSlice.length !== slices.length) {
        debug('filterNodeSlices() warn, found invalid slice, slices=', slices)
    }
    return validSlice
}

export function getNodeSlicesByTimeRange(slices: NodeSlice[], start, end) {
    if (slices instanceof Array) {
        const validSlices = filterNodeSlices(slices)
            .map(slice => chopNodeSlice(slice, start, end))
            .filter(slice => slice.start < slice.end)
        if (validSlices.length <= 0) {
            debug('getNodeSlicesByTimeRange() warn, validSlices not found')
            return null
        } else if (validSlices.length >= 1) {
            return validSlices
        }
    } else {
        return null
    }
}

export function getStaffSliceTimeRange(slices, start, end) {
    if (slices instanceof Array && slices.length >= 1) {
        let staffSlices = getNodeSlicesByTimeRange(slices, start, end)
        if (staffSlices instanceof Array) {
            if (staffSlices.length === 1) {
                return {
                    start: staffSlices[0].start,
                    end: staffSlices[0].end,
                }
            } else {
                throw new Error(
                    `getStaffIncomingTimeRange() error, staffSlices:${JSON.stringify(slices)}, too many slices`
                )
            }
        }
    }
    return { start, end }
}

export function hasNewManager(positionChanges: PositionChange[], team, date, leader = null) {
    // leader !== positionChange.name
    const nextManagerChange = positionChanges.filter(
        positionChange =>
            moment(positionChange.date).isSameOrAfter(moment(date)) &&
            moment(positionChange.date).isSameOrBefore(moment(date).add(7, 'days')) &&
            positionChange.current.team === team &&
            positionChange.current.position === '项目经理'
    )[0]
    return nextManagerChange != null && nextManagerChange.name !== leader
}

async function findTeamNameChanges() {
    const positionChanges = await getPositionChanges()

    return positionChanges
        .filter(
            positionChange =>
                positionChange.current.position === '项目经理' &&
                positionChange.previous.position === '项目经理' &&
                positionChange.previous.team != null &&
                positionChange.current.team != null &&
                positionChange.previous.team !== positionChange.current.team
        )
        .map(positionChange => ({
            leader: positionChange.name,
            date: positionChange.date,
            from: positionChange.previous.team,
            to: positionChange.current.team,
        }))
        .filter(teamChange => !hasNewManager(positionChanges, teamChange.from, teamChange.date))
}

async function printTeamChanges() {
    const teamChanges = await findTeamNameChanges()
    console.log('项目经理,原组别,新组别,异动日期')
    teamChanges.forEach(teamChange => {
        console.log(
            teamChange.leader +
                ',' +
                teamChange.from +
                ',' +
                teamChange.to +
                ',' +
                teamChange.date
        )
    })
}

export async function getTeamNames(tree: Map<string, Map<string, TeamSlice[]>>, start, end) {
    return [...tree.entries()]
        .filter(entry => {
            let managerTeamSlices = entry[1]
            let nodeSlices = _.flatten([...managerTeamSlices.values()])
            return nodeSlices.map(slice => chopNodeSlice(slice, start, end)).some(slice => slice.start < slice.end)
        })
        .map(entry => entry[0])
}

function getNextStaffPositionLevel(level) {
    switch (level) {
        case 'team':
            return 'manager'
        case 'manager':
            return 'groupLeader'
        case 'groupLeader':
            return 'name'
    }
}

async function visitNode(staffPosition: StaffPosition, tree, level, callback) {
    if (tree instanceof Map) {
        for (let entry of tree.entries()) {
            let newSp: StaffPosition = {}
            Object.assign(newSp, staffPosition)
            newSp[level] = entry[0]
            newSp.name = entry[0]
            await visitNode(newSp, entry[1], getNextStaffPositionLevel(level), callback)
        }
    } else if (tree instanceof Array) {
        for (let item of tree) {
            await visitNode(Object.assign({}, staffPosition), item, level, callback)
        }
    } else if (tree instanceof NodeSlice) {
        let nodeSp: StaffPosition
        if (!!tree['department']) {
            staffPosition.department = tree['department']
        }
        if (staffPosition.name === staffPosition.manager) {
            nodeSp = Object.assign(
                {
                    start: tree._start,
                    end: tree.nameEnd || tree.end,
                    status: tree.status,
                },
                staffPosition
            )
        } else {
            nodeSp = Object.assign(
                {
                    start: tree.start || staffPosition.leaderStart,
                    end: tree.end || staffPosition.leaderEnd,
                    status: tree.status,
                },
                staffPosition
            )
        }
        await callback(nodeSp, tree)
        let parentSp = Object.assign({}, staffPosition, {
            leaderStart: tree.start || staffPosition.leaderStart || null,
            leaderEnd: tree.end || staffPosition.leaderEnd || null,
        })
        if (!!tree.nameEnd) {
            // use new team name with staff belong to this team
            return
        }
        if (staffPosition.groupLeader === '王晶' && staffPosition.name === '王晶') {
            debug('王晶 parentSp=', parentSp, '\ntree=', tree, '\ntree.end=', tree.end)
        }
        if (tree.staffTree) {
            await visitNode(parentSp, tree.staffTree, 'name', callback)
        }
        if (tree.subSliceTree) {
            await visitNode(parentSp, tree.subSliceTree, level, callback)
        }
    }
}

export async function visitTree(callback) {
    let tree = await getTreeLife()
    await visitNode({ team: null }, tree, 'team', callback)
}

export function cleanTreeLife() {
    gTreeLife = null
}

export function getSampleUnixTime(sp: TimeRange, bStart = false) {
    if (bStart) {
        if (!!sp.start) {
            return moment(sp.start).unix()
        } else {
            return sp.end ? moment(sp.end).unix() : Number.MAX_SAFE_INTEGER
        }
    } else {
        if (!!sp.end) {
            return moment(sp.end)
                .subtract(1, 'day')
                .unix()
        } else {
            return sp.start ? moment(sp.start).unix() : Number.MIN_SAFE_INTEGER
        }
    }
}

async function _getStaffPositionMap(): Promise<Map<string, StaffPosition[]>> {
    let staffPositionMap = new Map<string, StaffPosition[]>()
    await visitTree((staffPosition: StaffPosition, nodeSlice: NodeSlice) => {
        // if (staffPosition.team === '联想项目组') debug('staffPosition=', staffPosition)
        if (staffPosition.name) {
            if (!staffPositionMap.has(staffPosition.name)) {
                staffPositionMap.set(staffPosition.name, [])
            }
            staffPosition.nodeSlice = nodeSlice
            staffPositionMap.get(staffPosition.name).push(staffPosition)
        }
    })
    for (let staffPositions of staffPositionMap.values()) {
        staffPositions.sort((sp1, sp2) => getSampleUnixTime(sp1) - getSampleUnixTime(sp2))
    }
    return staffPositionMap
}

export async function getStaffPositionMap(): Promise<Map<string, StaffPosition[]>> {
    if (!gStaffPositionMap) {
        gStaffPositionMap = _getStaffPositionMap()
    }
    return gStaffPositionMap
}

export function filterSortedTimeRangesByTime(staffPositions: TimeRange[], start, end): any[] {
    if (staffPositions instanceof Array && staffPositions.length > 0) {
        let sps: StaffPosition[] = []
        for (let i = staffPositions.length - 1; i >= 0; --i) {
            if (hasNodeSliceFit(staffPositions[i], start, end)) {
                sps.unshift(staffPositions[i])
            }
            if (
                getSampleUnixTime(staffPositions[i], true) <= (start ? moment(start).unix() : Number.MIN_SAFE_INTEGER)
            ) {
                break
            }
        }
        return sps
    } else {
        return []
    }
}

export async function getStaffPositionsOfStaff(name, start = null, end = null): Promise<StaffPosition[]> {
    let staffPositionMap = await getStaffPositionMap()
    return filterSortedTimeRangesByTime(staffPositionMap.get(name), start, end).map(sp => {
        let newSp = Object.assign({}, sp)
        delete newSp.nodeSlice
        return newSp
    })
}
async function _getStaffPositionsOfStaff_v1(name, start = null, end = null): Promise<StaffPosition[]> {
    let staffPositions: StaffPosition[] = []
    visitTree((staffPosition: StaffPosition, nodeSlice: NodeSlice) => {
        if (
            staffPosition.name === name &&
            // &&!nodeSlice.nameEnd
            hasNodeSliceFit(nodeSlice, start, end)
        ) {
            debug('getStaffPositionsOfStaff() ', staffPosition.team, 'nodeSlice=', nodeSlice)
            staffPositions.push(
                Object.assign({}, staffPosition, {
                    start: nodeSlice._start,
                    end: nodeSlice.nameEnd ? nodeSlice.nameEnd : nodeSlice.end,
                })
            )
        }
    })
    return staffPositions
}
