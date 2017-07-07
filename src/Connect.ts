import { BaseInterface } from './Store'
import { Container } from 'flux/utils'

export type FunctionifyState<P, S> = {
  [K in keyof S]?: (props?: P) => S[K]
}


export function Connect<P=never, S=never>(...stores: [BaseInterface<{}>, FunctionifyState<P, S>][]) {
  const allstores: BaseInterface<{}>[] = []
  const calcs = new Map<string, (p: P) => any>()
  stores.forEach(s => {
    const store = s[0]
    allstores.push(store)
    const mapping = s[1] as any
    for (const k in mapping) {
      calcs.set(k, mapping[k].bind(store))
    }
    Object.assign(calcs, s[1])
  })
  return function (target: { new (): React.Component<P, S>, calculateState?(prevState: S | undefined, props: P): Partial<S> }) {

    const cls = class extends target {
      static getStores() {
        return allstores
      }
      static calculateState(prevState: S | undefined, props: P): Partial<S> {
        if (super.calculateState !== undefined) {
          return super.calculateState(prevState, props)
        }
        const res: {[key:string]: any} = {}
        for (const [k, v] of calcs) {
          res[k] = v(props)
        }
        return res as Partial<S>
      }
    }
    return Container.create(cls as any, { withProps: true })
  }
}