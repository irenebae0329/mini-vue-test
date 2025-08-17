import { isOn } from "./shared.js"
import { shouldSetAsProps } from "./util.js"
function patchProps(el: EnHancedHTMLElement, key: string, preValue: any, nextValue: any): void {

    if (key in el) { // 判断key是否存在于DOM Properties
        if (isOn(key)) {
            const invokers = el._vei || (el._vei = {})

            let invoker = invokers[key] as InVoker
            const name = key.slice(2).toLowerCase()

            if (nextValue) {
                if (!invoker) {
                    invoker = (e) => {
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach((fn) => {
                                if (invoker.attached && e.timeStamp < invoker.attached) return
                                fn(e)
                            })
                        } else if (invoker.value) {
                            invoker.value(e)
                        }
                    }
                    invoker.attached = performance.now()
                    invoker.value = nextValue
                    el.addEventListener(name, invoker)
                } else {
                    invoker.value = nextValue
                }

            } else if (invoker) {
                el.removeEventListener(name, invoker)
            }

        }
        else if (key === 'class') {
            el.className = nextValue || ''
        } else if (shouldSetAsProps(el, key, nextValue)) { // 是否为可写属性
            const type = typeof el[key]
            if (type === 'boolean' && nextValue === '') {
                (el as any)[key] = true // 对bool值作值矫正
            } else {
                (el as any)[key] = nextValue
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    }
}

function createElement(type) {
    const element = document.createElement(type);
    return element;
}

function createText(text) {
    return document.createTextNode(text);
}

function setText(node, text) {
    node.nodeValue = text;
}

function setElementText(el, text) {
    el.textContent = text;
}
function insert(child, parent, anchor = null) {
    console.log("Insert");
    parent.insertBefore(child, anchor);
}

export {
    patchProps,
    createElement,
    createText,
    setText,
    setElementText,
    insert
}
