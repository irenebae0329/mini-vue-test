declare global {
    interface VNode {
        props: Record<string, any>
        el: EnHancedHTMLElement | null | Text
        children?: any
        [key: string]: any
    }

    type ForgeHTMLEvent = EventListener
    type InVoker = {
        (e: Event): void
        attached?: number // 默认为0
        value?: ForgeHTMLEvent | ForgeHTMLEvent[]
    }

    interface EnHancedHTMLElement extends HTMLElement {
        _vei: {
            [key: string]: InVoker
        }
    }
    interface PatchProps {
        (el: EnHancedHTMLElement, key: string, preValue: any, nextValue: any): void
    }

}

export { } 