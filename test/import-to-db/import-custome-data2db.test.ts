import { search, setEsUrl } from '@uranplus/cavalry-utils'
import * as esb from 'elastic-builder'
describe('save employee', () => {
    it('saveEmployee2db() should work', async () => {
        setEsUrl('http://es.nj.jsdebug.org')
        const salary = await search(
            'salary_fruit',
            'salary',
            esb
                .requestBodySearch()
                .query(esb.matchAllQuery())
                .size(100000)
        )
        console.log(salary)
    }).timeout(10000)
})
