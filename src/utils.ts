/**
 * Determines whether two arrays are deeply equal. Two arrays are considered equal if they have the
 * same length and corresponding elements are equal. This function also supports nested arrays,
 * comparing them recursively.
 *
 * @param a - The first array to compare.
 * @param b - The second array to compare.
 * @returns Returns `true` if the arrays are deeply equal, otherwise `false`.
 *
 * @example
 * arrayEquals([1, 2, 3], [1, 2, 3]); // true
 * arrayEquals([1, 2, 3], [3, 2, 1]); // false
 * arrayEquals([1, [2, 3]], [1, [2, 3]]); // true
 * arrayEquals([1, [2, 3]], [1, [3, 2]]); // false
 * arrayEquals([1, 2, 3], null); // false
 * arrayEquals(null, null); // false
 */
const arrayEquals = (a: any[], b: any[]) => {
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

/**
 * Creates a deep copy of an array, recursively copying any nested arrays.
 * Non-array objects within the array are not deep copied (they remain references).
 *
 * @param arr - The array to copy.
 * @returns A deep copy of the array with all nested arrays also copied.
 *
 * @example
 * const original = [[1, 2], [3, 4]];
 * const copy = deepCopyArray(original);
 * copy[0][0] = 99;
 * console.log(original[0][0]); // 1 (unchanged)
 */
const deepCopyArray = (arr: any[]): any[] => {
    const copy = arr.slice(0);
    for (let i = 0; i < copy.length; i++) {
        if (copy[i] instanceof Array) {
            copy[i] = deepCopyArray(copy[i]);
        }
    }
    return copy;
};

export { arrayEquals, deepCopyArray };
