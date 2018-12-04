import { getStaffPositionsOfStaff } from '@uranplus/cavalry-sdk'
import * as fs from 'fs'
import * as path from 'path'
import * as raw_path from '@uranplus/cavalry-raw-files'
import * as _ from 'lodash'
import * as moment from 'moment'
import { BaseDataServiceV1 } from '../service/base-data-service'
import { DailyPersonalResumeCost } from '@uranplus/cavalry-define'

let gPhraseMapping = fs.readFileSync(path.join(raw_path, 'resume/name-mapping.json'))

function getNameValueList(month: string) {
    var buf = fs.readFileSync(path.join(raw_path, `resume/${month}/resume-download-statistic.csv`))
    var lines = buf.toString().split('\r\n')
    return lines
        .filter(line => line.trim().length > 0)
        .map(line => {
            const cells = line.split(',')
            return {
                name: cells[0].replace(/"/g, ''),
                date: cells[2].replace(/"/g, ''),
                value: Number(cells[3]),
            }
        })
}

function phraseMap(phrase) {
    return gPhraseMapping[phrase] ? gPhraseMapping[phrase] : phrase
}

function compatiblePatch(nameValue) {
    nameValue.name = phraseMap(nameValue.name)
    return nameValue
}

export function getDailyPersonalResumeCosts(month: string): DailyPersonalResumeCost[] {
    return getNameValueList(month)
        .map(compatiblePatch)
        .filter(resumeCost => !!resumeCost.name)
}

if (require.main === module) {
    const config = require('config')
    const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
    ;(async function() {
        let baseDataServiceV1 = new BaseDataServiceV1()
        let teamValueList: any = {}
        let lastName
        for (let nameValue of getNameValueList(month)) {
            let sps = await getStaffPositionsOfStaff(
                nameValue.name,
                nameValue.date,
                moment(nameValue.date)
                    .add(1, 'day')
                    .format('YYYY-MM-DD')
            )
            if (sps instanceof Array) {
                if (sps.length === 1) {
                    if (teamValueList[sps[0].team] == null) {
                        teamValueList[sps[0].team] = 0
                    }
                    teamValueList[sps[0].team] += nameValue.value
                    continue
                } else if (sps.length === 0) {
                    let employee = await baseDataServiceV1.getEmployeeByName(nameValue.name, month)
                    if (employee) {
                        if (teamValueList[employee.team] == null) {
                            teamValueList[employee.team] = 0
                        }
                        teamValueList[employee.team] += nameValue.value
                        continue
                    }
                }
            }
            if (lastName !== nameValue.name) {
                lastName = nameValue.name
                console.error('get position of staff, error! nameValue:', nameValue, ' staffPositions=', sps)
            }
        }
        console.log('teamValueList=', teamValueList)
    })()
}
