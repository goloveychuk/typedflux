import { Dispatcher } from 'flux';



export interface FluxAppInterface {
  dispatch<T>(action: symbol, data: T): void
  dispatcher: Dispatcher<Payload<{}>>
}






export type Payload<T> = {
  action: symbol
  data: T
}

export {Dispatcher}