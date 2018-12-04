import { JobStatus } from './job-status.enum'
export class NodeSlice {
    public _start: string
    public _end: string
    public nameEnd?: string
    public isValid?: boolean
    public status?: JobStatus
    constructor(
        start: string,
        end: string,
        public title: string = null,
        public position: string = null,
        status = JobStatus.TRANSFER
    ) {
        this.start = start
        this.end = end
        this.status = status
    }
    // get start() {
    //     return this._start
    // }
    // set start(start) {
    //     this._start = start
    // }
    // get end() {
    //     return this._end
    // }
    // set end(end) {
    //     this._end = end
    // }
    get start() {
        if (!!this['link']) {
            return this['link'].start
        } else {
            return this._start
        }
    }
    set start(start) {
        if (!!this['link']) {
            // change origin start
            this['link'].start = start
        } else {
            this._start = start
        }
    }
    get end() {
        if (!!this['link']) {
            return this['link']._end
        } else {
            return this._end
        }
    }
    set end(end) {
        if (!!this['link']) {
            this._end = end
            // change origin end
            this['link'].end = end
        } else {
            this._end = end
        }
    }
    get subSliceTree(): Map<string, GroupSlice[]> {
        if (!!this['link']) {
            return this['link'].subSliceTree
        } else {
            return this['_subSliceTree']
        }
    }
    set subSliceTree(subSliceTree: Map<string, GroupSlice[]>) {
        if (!!this['link']) {
            this['link'].subSliceTree = subSliceTree
        } else {
            this['_subSliceTree'] = subSliceTree
        }
    }
    get staffTree(): Map<string, StaffSlice[]> {
        if (!!this['link']) {
            return this['link'].staffTree
        } else {
            return this['_staffTree']
        }
    }
    set staffTree(staffTree: Map<string, StaffSlice[]>) {
        if (!!this['link']) {
            this['link'].staffTree = staffTree
        } else {
            this['_staffTree'] = staffTree
        }
    }
}
export class NoneLeafNodeSlice extends NodeSlice {
    protected _subSliceTree?: Map<string, NoneLeafNodeSlice[]>
    protected _staffTree?: Map<string, StaffSlice[]>
    // get subSliceTree() {
    //     return this._subSliceTree
    // }
    // set subSliceTree(subSliceTree) {
    //     this._subSliceTree = subSliceTree
    // }
    // get staffTree() {
    //     return this._staffTree
    // }
    // set staffTree(staffTree) {
    //     this._staffTree = staffTree
    // }

    constructor(start: string, end: string, title: string, position: string) {
        super(start, end, title, position)
    }
}

export class TeamSlice extends NoneLeafNodeSlice {
    public oldName?: string
    public newName?: string
    public link?: TeamSlice
    public aliasStart?: string
    public department?: string
    constructor(start: string, end: string, title: string, position: string) {
        super(start, end, title, position)
    }

    // toString() {
    //     return Object.assign({}, this)
    // }
}

export class GroupSlice extends NoneLeafNodeSlice {
    constructor(start: string, end: string, title: string, position: string) {
        super(start, end, title, position)
    }
}

export class StaffSlice extends NodeSlice {
    constructor(start: string, end: string, title: string, position: string) {
        super(start, end, title, position)
    }
}
