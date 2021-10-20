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

const toSqlDate = (date) => {
    var pad = function (num) { return ('00' + num).slice(-2) };
    var str = date.getUTCFullYear() + '-' +
        pad(date.getUTCMonth() + 1) + '-' +
        pad(date.getUTCDate());
    return str;
}

const sanityDateYMD = d => {
    if (!d) return null;
    if (dayjs(d).isValid() && /\d{4}-\d{2}-\d{2}/.test(d)) {
        return d;
    }

    return null;
}

const sanityDate = (d) => {
    if (!d) return null;
    if (dayjs(d).isValid()) {
        const date = dayjs(d).toDate();
        const sqlDate = toSqlDate(date);
        return SqlString.escape(sqlDate);
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

        return [...new Set(arr)];
    }

    return [];
}


const dmyToYmD = (dmy, seperator) => {
    seperator = seperator || '/';
    const [d, m, y] = dmy.split(seperator);

    return `${y}-${m}-${d}`;
}

const removeAccents = (str) => {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

module.exports = {
    sanityArrayNum,
    sanityOrder,
    sanityString,
    dmyToYmD,
    sanityNumber,
    escapeString,
    sanityDate,
    sanityDateYMD,
    removeAccents
}