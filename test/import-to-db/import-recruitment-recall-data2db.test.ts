import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { ormRecruitmentRecallFormXlsx } from '../../src/import-to-db/import-recruitment-recall-data2db'
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const bodybuilder = require('bodybuilder')
describe('save recruitment recall', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('ormRecruitmentRecallFormXlsx() should work', async () => {
        if (config.get('cavalry.es.recruitment_recall.reimport_records')) {
            await del(
                config.get('cavalry.es.recruitment_recall.index'),
                config.get('cavalry.es.recruitment_recall.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.recruitment_recall.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await ormRecruitmentRecallFormXlsx(
                config.get('cavalry.es.recruitment_recall.index'),
                config.get('cavalry.es.recruitment_recall.type')
            )
        } else {
            console.log('config `cavalry.es.employee.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
