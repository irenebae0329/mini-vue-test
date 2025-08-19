import { reactive, effect } from "./reactivity/src";
import { patchProps, createElement, createText, setElementText, insert } from "./runtime-dom"
import { getLIS } from "./util";
interface IcreateRendereProps {
    [key: string]: any;
    patchProps: PatchProps
}
const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()
function createRenderer(options: IcreateRendereProps) {
    const {
        createElement,
        setElementText,
        insert,
        patchProps
    } = options

    function mountElement(vnode, container, anchor) {
        const el = vnode.el = createElement(vnode.type)
        if (typeof vnode.children == 'string') {
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) [
            vnode.children.forEach(child => {
                patch(null, child, el)
            })
        ]
        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }
        insert(el, container, anchor)
    }
    //n1 old element n2:new element
    function patchChildren(n1: VNode, n2: VNode, container) {
        if (typeof n2.children === 'string') {
            if (Array.isArray(n1.children)) {
                n1.children.forEach((c) => unmount(c))
            }
            setElementText(container, n2.children)
        } else if (Array.isArray(n2.children)) {
            if (Array.isArray(n1.children)) {
                //这里是diff 
                /**
                 * 简单diff
                 */
                // let maxIndex = 0
                // for (let i = 0; i < n2.children.length; i++) {
                //     const newVnode = n2.children[i]
                //     for (let j = 0; j < n1.children.length; j++) {
                //         let oldVnode = n1.children[j]
                //         if (newVnode.key == oldVnode.key) {
                //             patch(newVnode, oldVnode, container)
                //             if (j < maxIndex) {
                //                 //移动
                //                 const preNode = n1.children[j - 1].el as VNode
                //                 if (preNode) {
                //                     const anchor = preNode.el?.nextSibling
                //                     insert(newVnode.el, container, anchor)
                //                 }
                //             }
                //             maxIndex = Math.max(maxIndex, j)
                //         }
                //         break

                //     }
                // }

                /**
                 * 双端diff
                 */
                // const oldChildren = n2.children
                // const newChildren = n1.children
                // let oldstartIndex = 0
                // let oldendIndex = oldChildren.length - 1
                // let newstartIndex = 0
                // let newendIndex = newChildren.length - 1
                // while (oldstartIndex <= oldendIndex && newstartIndex <= newendIndex) {
                //     let oldStartVnode = oldChildren[oldstartIndex]
                //     let oldEndVnode = oldChildren[oldendIndex]
                //     let newStartVnode = newChildren[newstartIndex]
                //     let newEndVnode = newChildren[newendIndex]
                //     let found = false
                //     if (!oldStartVnode) {
                //         oldStartVnode = oldChildren[++oldstartIndex]
                //         continue
                //     }
                //     if (oldEndVnode.key == newStartVnode.key) {
                //         found = true
                //         patch(newStartVnode, oldEndVnode, container)
                //         insert(oldEndVnode.el, container, oldStartVnode.el)
                //         oldEndVnode = oldChildren[--oldendIndex]
                //         newStartVnode = newChildren[++newstartIndex]
                //     } else if (oldStartVnode.key == newEndVnode.key) {
                //         found = true
                //         patch(newEndVnode, oldStartVnode, container)
                //         insert(oldStartVnode, container, oldEndVnode.el.nextSibling)
                //         oldStartVnode = oldChildren[++oldstartIndex]
                //         newEndVnode = newChildren[--newendIndex]
                //     } else if (oldStartVnode.key == newStartVnode.key) {
                //         found = true
                //         patch(newStartVnode, oldStartVnode, container)
                //         oldStartVnode = oldChildren[++oldstartIndex]
                //         newStartVnode = newChildren[--newstartIndex]
                //     } else if (oldEndVnode.key == newEndVnode.key) {
                //         found = true
                //         patch(oldEndVnode, newEndVnode, container)
                //         oldEndVnode = oldChildren[--oldendIndex]
                //         newEndVnode = newChildren[--newendIndex]
                //     } else {
                //         const idxInOld = oldChildren.findIndex((oldVnode) => oldVnode.key == newStartVnode.key)
                //         if (idxInOld !== -1) {
                //             const nodeToMove = oldChildren[idxInOld].el
                //             patch(nodeToMove, newStartVnode, container)
                //             insert(nodeToMove, container, oldStartVnode)
                //             oldChildren[idxInOld] = undefined
                //         } else {
                //             patch(null, newStartVnode, container)
                //             insert(newStartVnode.el, container, oldStartVnode.el)
                //         }
                //         newStartVnode = newChildren[++newstartIndex]
                //     }
                // }

                // if (oldendIndex < oldstartIndex && newstartIndex <= newendIndex) {
                //     for (let i = newstartIndex; i < newendIndex; i++) {
                //         let newStartVnode = newChildren[i]
                //         patch(null, newStartVnode, container, oldChildren[oldstartIndex].el) // oldStartVnode
                //     }
                // } else if (newstartIndex > newendIndex && oldstartIndex < oldendIndex) {
                //     for (let i = oldstartIndex; i < oldendIndex; i++) {
                //         unmount(oldChildren[i])
                //     }
                // }

                /**
                 * 快速diff
                 */

                const oldChildren = n2.children
                const newChildren = n1.children
                let j = 0
                let oldendIndex = oldChildren.length - 1
                let newendIndex = newChildren.length - 1
                let oldEndVnode = oldChildren[oldendIndex]
                let newEndVnode = newChildren[newendIndex]
                let oldVnode = oldChildren[j]
                let newVnode = newChildren[j]
                while (oldEndVnode.key == newEndVnode.key) {
                    patch(oldEndVnode, newEndVnode, container)
                    oldEndVnode = oldChildren[++oldendIndex]
                    newEndVnode = newChildren[++newendIndex]
                }

                while (oldVnode.key == newVnode.key) {
                    patch(oldVnode, newVnode, container)
                    j++
                    oldEndVnode = oldChildren[j]
                    newEndVnode = newChildren[j]
                }

                if (j > oldendIndex && j <= newendIndex) {
                    for (let i = j; i <= newendIndex; i++) {
                        const anchorIndex = newendIndex + 1
                        const oldEndVnode = anchorIndex < oldChildren.length - 1 ? oldChildren[anchorIndex] : null
                        patch(null, newChildren[i], container, oldEndVnode)
                    }
                } else if (j <= oldendIndex && j > newendIndex) {
                    for (let i = j; i < oldendIndex; i++) {
                        unmount(oldChildren[i])
                    }
                } else {
                    const keyIndexMap = new Map()
                    let count = newendIndex - j + 1
                    const source = new Array(count).fill(-1)
                    let moved = false
                    let maxIndexSoFar = 0
                    let patched = 0
                    for (let i = j; i < newendIndex; i++) {
                        keyIndexMap.set(newChildren[i].key, i)
                    }
                    for (let i = j; i < oldendIndex; i++) {
                        if (patched >= count) {
                            unmount(oldChildren[i])
                            continue
                        }
                        const k = keyIndexMap.get(oldChildren[i].key)
                        if (typeof k !== undefined) {
                            patch(oldChildren[i], newChildren[k], container)
                            patched++
                            source[k - j] = i

                            if (k > maxIndexSoFar) {
                                maxIndexSoFar = k
                            } else {
                                moved = true
                            }
                        } else {
                            unmount(oldChildren[i])
                        }
                    }

                    if (moved) {
                        let sequence = getLIS(source)
                        let s = sequence.length - 1
                        let i = source.length - 1
                        for (i; i >= 0; i--) {
                            if (source[i] == -1) {
                                //新节点，挂载
                                const pos = j + i
                                const newVnode = newChildren[pos]

                                const anchor = pos + 1 < source.length ? newChildren[pos + 1] : null
                                patch(null, newVnode.el, container, anchor.el)
                            } else if (i !== sequence[s]) {
                                const pos = j + i
                                const newVnode = newChildren[pos]

                                const nextPos = pos + 1
                                const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
                                insert(newVnode, container, anchor)
                            } else {
                                //i == sequence[s] 维持
                                s--
                            }
                        }
                    }

                }

            } else {
                setElementText(container, '')
                n2.children.forEach(c => patch(null, c, container))
            }
        } else {
            if (Array.isArray(n1.children)) {
                n1.children.forEach(c => unmount(c))
            } else if (typeof n1.children == 'string') {
                setElementText(container, '')
            }
        }
    }
    function patchElement(n1: VNode, n2: VNode) {
        const el = n2.el = n1.el as EnHancedHTMLElement
        const oldProps = n1.props
        const newProps = n2.props
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key])
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                patchProps(el, key, oldProps[key], null)
            }
        }
        //patch
        patchChildren(n1, n2, el)
    }

    /**
     * 
     * @param n2 
     * @param container 01 
     * const MyComponent = {
02   // 组件名称，可选
03   name: 'MyComponent',
04   // 组件的渲染函数，其返回值必须为虚拟 DOM
05   render() {
06     // 返回虚拟 DOM
07     return {
08       type: 'div',
09       children: `我是文本内容`
10     }
    data(){
       return {
         foo:'hello world' 
       }
    }
11   }
12 }
     * @param anchor 
     */

    function mountComponent(vnode, container, anchor) {
        const componentOptions = vnode.type
        const { render, data, beforeCreate,
            created, beforeMount, mounted,
            beforeUpdate, updated } = componentOptions
        beforeCreate && beforeCreate()
        const state = reactive(data())
        const instance = {
            state,
            isMounted: false,
            subTree: null
        }
        created && created(state)
        vnode.component = instance
        effect(() => {
            const subTree = render.call(state, state)
            if (!instance.isMounted) {
                beforeMount && beforeMount.call(state)
                patch(null, subTree, container, anchor)
                instance.isMounted = true
                mounted && mounted.call(state)
            } else {
                beforeUpdate && beforeUpdate.call(state)
                patch(instance.subTree, subTree, container, anchor)
                updated && updated.call(state)
            }
            instance.subTree = subTree
        }, {
            scheduler(fn) {
                queueJob(fn)
            }
        })
    }

    function patchComponent(n1, n2, anchor) {

    }


    function unmount(node: VNode) {

        const parent = node?.el?.parentNode;
        if (parent) parent.removeChild(vnode?.el as Node)

    }
    /**
     * 
     * @param n1  oldVnode
     * @param n2 newVnode
     * @param container parentHtmlNode
     */
    function patch(n1: VNode | null, n2: VNode, container, anchor = null) {
        if (n1 && n1.type !== n2.type) {
            unmount(n1) // n1 n2类型不同，先卸载n1
            n1 = null
        }

        const {
            type
        } = n2
        if (typeof type == 'string') { // 处理普通标签
            if (!n1) {
                mountElement(n2, container, anchor)
            } else {
                //更新
                patchElement(n1, n2)
            }
        } else if (type == Text) {
            if (!n1) {
                const el = n2.el = createText(n2.children)
                insert(el, container)
            } else {
                const el = n2.el = n1.el as Text
                if (n2.children !== n1.children) {
                    el.nodeValue = n2.children
                }
            }
        } else if (type == Fragment) {
            if (!n1) {
                n2.children.forEach((c) => patch(null, c, container))
            } else {
                patchChildren(n1, n2, container)
            }
        } else if (typeof type === 'object') {
            if (!n1) {
                mountComponent(n2, container, anchor)
            } else {
                patchComponent(n1, n2, anchor)
            }
        }

    }
    function render(vnode: VNode, container: HTMLElement & { _vnode: VNode }) {
        if (vnode) {
            patch(vnode, container._vnode, container)
        } else {
            unmount(container._vnode)
        }
        container._vnode = vnode

    }
    return {
        render
    }
}
const renderer = createRenderer({
    createElement,
    setElementText,
    insert,
    patchProps,
})
const vnode: VNode = {
    type: 'h1',
    props: {},
    children: 'hello',
    el: null
}
const container = { type: 'root' }
renderer.render(vnode, document.querySelector('#app') as any)


