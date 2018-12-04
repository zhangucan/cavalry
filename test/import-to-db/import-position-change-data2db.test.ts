import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { savePositionChange } from '../../src/import-to-db/import-position-change-data2db'
const bodybuilder = require('bodybuilder')

describe('save date', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('savePositionChange() should work', async () => {
        if (config.get('cavalry.es.position_change.reimport_records')) {
            await del(
                config.get('cavalry.es.position_change.index'),
                config.get('cavalry.es.position_change.type'),
                bodybuilder()
                    .query('term', '_type', config.get('cavalry.es.position_change.type'))
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await savePositionChange(
                config.get('cavalry.es.position_change.index'),
                config.get('cavalry.es.position_change.type')
            )
        } else {
            console.log('config `cavalry.es.position_change.reimport_records` is false, skip')
        }
    }).timeout(100000)
})
