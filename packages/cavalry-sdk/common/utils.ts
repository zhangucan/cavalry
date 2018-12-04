import { StaffPosition, Role, AchievementType, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'

export function strMapToObj(strMap) {
    let obj = Object.create(null)
    for (let [k, v] of strMap) {
        obj[k] = v
    }
    return obj
}
export function deepMapToObj(strMap) {
    if (strMap instanceof Array) {
        let obj = []
        for (let v of strMap) {
            obj.push(deepMapToObj(v))
        }
        return obj
    } else if (strMap instanceof Set) {
        let obj = []
        for (let v of strMap.values()) {
            obj.push(deepMapToObj(v))
        }
        return obj
    } else if (strMap instanceof Map) {
        let obj = Object.create(null)
        for (let [k, v] of strMap) {
            obj[k] = deepMapToObj(v)
        }
        return obj
    } else if (strMap instanceof Object) {
        let obj = Object.create(null)
        for (let k in strMap) {
            obj[k] = deepMapToObj(strMap[k])
        }
        return obj
    } else {
        return strMap
    }
}

export function trimObj(obj) {
    const entry = {}
    Object.keys(obj).forEach(a => {
        entry[a] = obj[a].replace(/\s/g, '')
    })
    return entry
}

export function getLeader(staffPosition: StaffPosition) {
    if (staffPosition.groupLeader) {
        if (staffPosition.groupLeader === staffPosition.name) {
            return staffPosition.manager
        } else {
            return staffPosition.groupLeader
        }
    } else {
        if (staffPosition.manager === staffPosition.name) {
            return null
        } else {
            return staffPosition.manager
        }
    }
}
export function getEmployeeName(employee) {
    if (employee[DIC_CAT_MAPPING.ZJ.ZG.name]) {
        if (employee['专员']) {
            return employee['专员']
        } else {
            return employee[DIC_CAT_MAPPING.ZJ.ZG.name]
        }
    } else {
        if (employee['专员']) {
            return employee['专员']
        } else {
            return employee[DIC_CAT_MAPPING.ZJ.JL.name]
        }
    }
}
export function getLeaderFormXlsx(employee): string {
    if (employee[DIC_CAT_MAPPING.ZJ.ZG.name]) {
        if (employee['专员']) {
            return employee[DIC_CAT_MAPPING.ZJ.ZG.name]
        } else {
            return employee[DIC_CAT_MAPPING.ZJ.JL.name]
        }
    } else {
        if (employee['专员']) {
            return employee[DIC_CAT_MAPPING.ZJ.JL.name]
        } else {
            return null
        }
    }
}
export function getPosition(employee) {
    if (employee['专员']) {
        return Role.STAFF
    } else if (!employee['专员'] && employee[DIC_CAT_MAPPING.ZJ.ZG.name]) {
        return Role.GROPOUP_LEADER
    } else {
        return Role.MANAGER
    }
}
export function getAchievementType(employee): AchievementType {
    if (employee['业绩来源'] === '招聘') {
        return AchievementType.RECRUITMENT
    } else if (employee['业绩来源'] === '绩效') {
        return AchievementType.RESIDENT
    } else if (employee['业绩来源'] === '回款') {
        return AchievementType.BackToArticle
    }
}
