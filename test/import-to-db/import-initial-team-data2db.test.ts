import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { saveInitialTeam2db } from '../../src/import-to-db/import-initial-team-data2db'
const bodybuilder = require('bodybuilder')
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save initialTeam', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveInitialTeam2db() should work', async () => {
        if (config.get('cavalry.es.initial_team.reimport_records')) {
            await del(
                config.get('cavalry.es.initial_team.index'),
                config.get('cavalry.es.initial_team.type'),
                bodybuilder()
                    .filter('term', '_type', config.get('cavalry.es.initial_team.type'))
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveInitialTeam2db(
                config.get('cavalry.es.initial_team.index'),
                config.get('cavalry.es.initial_team.type')
            )
        } else {
            console.log('config `cavalry.es.initial_team.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
