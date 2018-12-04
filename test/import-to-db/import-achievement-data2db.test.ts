import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { ormAchievementFormXlsx } from '../../src/import-to-db/import-achievement-data2db'
import { ormHuiWangAchievementFormXlsx } from '../../src/import-to-db/import-huiwang-achievement-data2db'
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const bodybuilder = require('bodybuilder')
describe('save date', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveAchievement should work', async () => {
        if (config.get('cavalry.es.achievement.reimport_records')) {
            await del(
                config.get('cavalry.es.achievement.index'),
                config.get('cavalry.es.achievement.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.achievement.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await ormAchievementFormXlsx(
                config.get('cavalry.es.achievement.index'),
                config.get('cavalry.es.achievement.type')
            )
            await ormHuiWangAchievementFormXlsx(
                config.get('cavalry.es.achievement.index'),
                config.get('cavalry.es.achievement.type')
            )
        } else {
            console.log('config `cavalry.es.achievement.reimport_records` is false, skip')
        }
    }).timeout(50000)
})
