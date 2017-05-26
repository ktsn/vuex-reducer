import Vue from 'vue'
import Vuex from 'vuex'

export type Reducer<S> = (state: S, payload: any) => S

export interface ReducerTree<S> {
  [key: string]: Reducer<S>
}

export function reducers<S>(reducers: ReducerTree<S>): Vuex.MutationTree<S> {
  return mapValues(reducers, convertReducer)
}

function convertReducer<S>(reducer: Reducer<S>): Vuex.Mutation<S> {
  return (state, payload) => {
    const prevState = shallowClone(state)
    const nextState = reducer(prevState, payload)
    if (prevState === nextState) return

    const res = compareState(prevState, nextState)
    res.set.forEach(key => {
      Vue.set(state, key, (nextState as any)[key])
    })
    res.delete.forEach(key => {
      Vue.delete(state, key)
    })
  }
}

function compareState<S>(prev: S, next: S): { set: string[], delete: string[] } {
  const scope = Object.keys(prev)
  const set: string[] = []

  Object.keys(next).forEach(key => {
    // Added or updated the property
    if ((prev as any)[key] !== (next as any)[key]) {
      set.push(key)
    }

    // Mark checked property name
    const index = scope.indexOf(key)
    if (index > -1) {
      scope.splice(index, 1)
    }
  })

  return {
    set,
    // Keys that still exists in `scope` should be removed from state
    delete: scope
  }
}

function shallowClone<T>(obj: T): T {
  return mapValues(obj as any, v => v) as any
}

function mapValues<T, R>(
  obj: { [key: string]: T },
  fn: (val: T, key: string) => R
): { [key: string]: R } {
  const res: { [key: string]: R } = {}
  Object.keys(obj).forEach(key => {
    res[key] = fn(obj[key], key)
  })
  return res
}
