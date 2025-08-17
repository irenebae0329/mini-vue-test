export function shouldSetAsProps(el: HTMLElement, key: string, value?: any) {
    if (key == 'form' && el.tagName == 'INPUT') return false
    return key in el
}

/**
 * @param {number[]} nums
 * @return {number}
 */

export function getLIS(arr) {
    const p = arr.slice()
    let result = [0]
    let u, v, m, j;
    for (let i = 0; i < arr.length; i++) {
        const arrI = arr[i]
        if (arrI !== -1) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
            }
        }
        u = 0
        v = result.length - 1
        while (u < v) {
            m = (u + v) >> 1
            if (arrI > arr[result[m] as number]) {
                v = m
            } else {
                u = m + 1
            }
        }
        if (arr[result[u] as number] > arrI) {
            if (u > 0) {
                p[i] = result[u - 1]
            }
            result[u] = i
        }

    }
    u = result.length - 1
    v = result[u]
    while (u > 0) {
        result[u] = v
        v = p[v]
        u--
    }
    return result
}
