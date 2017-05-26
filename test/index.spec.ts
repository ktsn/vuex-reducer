import assert = require('power-assert')
import td = require('testdouble')
import Vue from 'vue'
import Vuex from 'vuex'
import { reducers } from '../src/index'

Vue.config.productionTip = false

describe('Vuex Reducer', () => {
  Vue.use(Vuex)
  const { Store } = Vuex

  it('should allow reducers', () => {
    const store = new Store({
      state: {
        value: 0
      },
      mutations: reducers<any>({
        inc: (state, n: number) => ({
          ...state,
          value: state.value + n
        })
      })
    })

    assert(store.state.value === 0)
    store.commit('inc', 1)
    assert(store.state.value === 1)
  })

  it('should retain all state as immutable', () => {
    const store = new Store({
      state: {
        value: {
          name: 'foo'
        },
        history: [] as { name: string }[]
      },
      mutations: reducers<any>({
        update: (state, name: string) => ({
          value: {
            name
          },
          history: state.history.concat(state.value)
        })
      })
    })

    store.commit('update', 'bar')
    store.commit('update', 'baz')
    store.commit('update', 'qux')

    const { history } = store.state
    assert(history.length === 3)
    ;['foo', 'bar', 'baz'].forEach((name, i) => {
      assert(history[i].name === name)
    })
  })

  it('should not update if there are no changes in returned value', done => {
    const expected = {
      test: 'test'
    }
    const spy = td.function()

    const store = new Store({
      state: {
        foo: 1,
        bar: expected
      },
      mutations: reducers<any>({
        inc: state => ({
          ...state,
          foo: state.foo + 1
        })
      })
    })

    store.watch(state => state.bar, spy as any)

    store.commit('inc')
    assert(store.state.foo === 2)
    assert(store.state.bar === expected)

    Vue.nextTick(() => {
      td.verify(spy(), { ignoreExtraArgs: true, times: 0 })
      done()
    })
  })

  it('should add reactive property', done => {
    const store = new Store<any>({
      state: {},
      mutations: reducers<any>({
        add: (state, p: { name: string, value: any }) => ({
          [p.name]: p.value
        })
      })
    })

    store.commit('add', {
      name: 'foo',
      value: 123
    })
    assert(store.state.foo === 123)

    store.watch(state => state.foo, (value, oldValue) => {
      assert(value === 456)
      assert(oldValue === 123)
      done()
    })

    store.commit('add', {
      name: 'foo',
      value: 456
    })
  })

  it('should remove property if it does not exists in returned value', () => {
    const store = new Store({
      state: {
        foo: 123,
        bar: 456
      },
      mutations: reducers({
        remove: (state: any) => ({
          foo: state.foo
        })
      })
    })

    assert(store.state.foo === 123)
    assert(store.state.bar === 456)
    store.commit('remove')
    assert(store.state.foo === 123)
    assert(!('bar' in store.state))
  })
})
