const bucket = new WeakMap()
let activeEffect;
let activeEffectStack = []
function effect(fn) {
    const effectFn = () => {
        fn()
    }
    activeEffect = effectFn;
    activeEffectStack.push(activeEffect)
    effectFn()
    activeEffectStack.pop()
}
function reactive(obj) {
    return new Proxy(obj, {
        set(target, key, val, receiver) {
            Reflect.set(target, key, val)
            trigger(target, key)
        },
        get(target, key) {
            track(target, key)
            return Reflect.get(target, key)
        }
    })
}
function track(target, key) {
    let depsMap = bucket.get(target)
    if (!depsMap) {
        bucket.set(target, depsMap = new Map())
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, deps = new Set())
    }
    deps.add(activeEffect)
}
function trigger(target, key) {
    let effectFnMap = bucket.get(target)

    if (!effectFnMap || !effectFnMap.get(key)) {
        return
    }

    const effectFns = effectFnMap.get(key)

    const effectToRun = new Set(effectFns)
    effectToRun.forEach((effectFn) => {
        effectFn && effectFn()
    })
}

let s = new Set()