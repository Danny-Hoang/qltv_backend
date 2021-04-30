const dayjs = require('dayjs');
const SqlString = require('sqlstring');

const sanityOrder = (order) => {
    order = (order + '').toLowerCase();
    if (order === 'descend' || order === 'desc') {
        return 'desc';
    }

    if (order === 'ascend' || order === 'asc') return 'asc';
    return '';
}

const sanityDate = (d) => {
    if (dayjs(d).isValid()) {
        return SqlString.escape(d);
    }

    return null;
}

const escapeString = (s) => SqlString.escape(s);

const sanityString = (s = '') => {
    if (!s) return '';
    return SqlString.escape(`%${s}%`);
}
const sanityNumber = (num) => {
    let s = num + '';
    if (/^\d+$/.test(s)) {
        return +num;
    }
    return null;
}

const sanityArrayNum = (arr = []) => {
    if (arr && Array.isArray(arr) && arr.length) {
        arr = arr.filter(e => !isNaN(e)).map(e => +e);

        return arr;
    }

    return [];
}


const dmyToYmD = (dmy, seperator) => {
    seperator = seperator || '/';
    const [d, m, y] = dmy.split(seperator);

    return `${y}-${m}-${d}`;
}

module.exports = {
    sanityArrayNum,
    sanityOrder,
    sanityString,
    dmyToYmD,
    sanityNumber,
    escapeString,
    sanityDate
}