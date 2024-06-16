/**
 * Determines whether two arrays are deeply equal. Two arrays are considered equal if they have the
 * same length and corresponding elements are equal. This function also supports nested arrays,
 * comparing them recursively.
 *
 * @param {Array} a - The first array to compare.
 * @param {Array} b - The second array to compare.
 * @returns {boolean} - Returns `true` if the arrays are deeply equal, otherwise `false`.
 *
 * @example
 * arrayEquals([1, 2, 3], [1, 2, 3]); // true
 * arrayEquals([1, 2, 3], [3, 2, 1]); // false
 * arrayEquals([1, [2, 3]], [1, [2, 3]]); // true
 * arrayEquals([1, [2, 3]], [1, [3, 2]]); // false
 * arrayEquals([1, 2, 3], null); // false
 * arrayEquals(null, null); // false
 */
const arrayEquals = (a, b) => {
    if (!a || !b) {
        return false;
    }

    const l = a.length;

    if (l !== b.length) {
        return false;
    }

    for (let i = 0; i < l; i++) {
        if (a[i] instanceof Array && b[i] instanceof Array) {
            if (!arrayEquals(a[i], b[i])) {
                return false;
            }
        } else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

export { arrayEquals };
