import expect from 'expect';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import {
  autobind,
  log,
  inject,
  injectProps,
  injectState,
  debounce,
  throttle,
} from '../src/';

describe('functions', () => {
  it('autobind', () => {
    class Component {

      constructor(value) {
        this.value = value;
      }

      @autobind
      method() {
        return this.value;
      }
    }

    const element = new Component(42);
    const method = element.method;
    expect(method()).toEqual(42);
  });

  it('log', (done) => {
    // let spy = null;

    // eslint-disable-next-line
    class Input extends React.Component {
      @log
      onChange() {
        // expect(spy).toHaveBeenCalled();
        done();
      }

      render() {
        return (
          <input
            value="foo"
            onChange={(e, ...params) => {
              // cannot spy console.log
              // spy = expect.spyOn(console, 'log');
              this.onChange(e, ...params);
            }}
          />
        );
      }
    }
    const rendered = ReactTestUtils.renderIntoDocument(<Input />);
    const input = ReactTestUtils.findRenderedDOMComponentWithTag(rendered, 'input');
    ReactTestUtils.Simulate.change(input);
  });

  it('injectProps', (done) => {
    // eslint-disable-next-line
    class Div extends React.Component {

      state = {}

      @injectProps
      foo({ foo }, value) {
        expect(this.props).toEqual({ foo: 'bar' });
        expect(foo).toEqual('bar');
        expect(value).toEqual('foo');
        done();
      }

      @injectProps
      bar({ foo }) {
        expect(this.state).toEqual({});
        expect(foo).toEqual('bar');
        this.foo('foo');
      }

      @injectProps
      render({ foo }) {
        expect(foo).toEqual('bar');
        this.bar();
        return (
          <div />
        );
      }
    }

    const renderer = ReactTestUtils.createRenderer();
    renderer.render(<Div foo="bar" />);
  });

  it('injectState', (done) => {
    // eslint-disable-next-line
    class Div extends React.Component {
      state = {
        foo: 'bar',
      }

      @injectState
      foo({ foo }, value) {
        expect(foo).toEqual('bar');
        expect(value).toEqual('foo');
        done();
      }

      @injectState
      bar({ foo }) {
        expect(foo).toEqual('bar');
        this.foo('foo');
      }

      @injectState
      render({ foo }) {
        expect(foo).toEqual('bar');
        this.bar();
        return (
          <div />
        );
      }
    }

    const renderer = ReactTestUtils.createRenderer();
    renderer.render(<Div />);
  });

  it('inject', (done) => {
    const injectRenderChildren = inject('renderChildren');

    // eslint-disable-next-line
    class Div extends React.Component {

      renderChildren() {
        return (
          <span>It Works!</span>
        );
      }

      @injectRenderChildren
      render(renderChildren) {
        expect(renderChildren).toBeA('function');
        expect(renderChildren()).toEqual(<span>It Works!</span>);
        done();
        return (
          <div />
        );
      }
    }

    const renderer = ReactTestUtils.createRenderer();
    renderer.render(<Div />);
  });

  it('debounce', (done) => {
    const simulateTextInput = (Input) => {
      const rendered = ReactTestUtils.renderIntoDocument(<Input />);
      const input = ReactTestUtils.findRenderedDOMComponentWithTag(rendered, 'input');
      ReactTestUtils.Simulate.change(input, { target: { value: 'first' } });
      ReactTestUtils.Simulate.change(input, { target: { value: 'second' } });
      ReactTestUtils.Simulate.change(input, { target: { value: 'third' } });
    };

    // eslint-disable-next-line
    class TrailingEdgeInput extends React.Component {
      @debounce(undefined, true)
      onChange(e) {
        expect(e.target.value).toEqual('first');
      }

      render() {
        return (
          <input
            onChange={this.onChange}
          />
        );
      }
    }

    // eslint-disable-next-line
    class LeadingEdgeInput extends React.Component {
      @debounce(1000)
      onChange(e) {
        expect(e.target.value).toEqual('third');
        done();
      }

      render() {
        return (
          <input
            onChange={this.onChange}
          />
        );
      }
    }

    simulateTextInput(TrailingEdgeInput);
    simulateTextInput(LeadingEdgeInput);
  });

  it('throttle', (done) => {
    const simulateTextInput = (Input) => {
      const rendered = ReactTestUtils.renderIntoDocument(<Input />);
      const input = ReactTestUtils.findRenderedDOMComponentWithTag(rendered, 'input');
      ReactTestUtils.Simulate.change(input, { target: { value: 'first' } });
      ReactTestUtils.Simulate.change(input, { target: { value: 'second' } });
      setTimeout(() => {
        ReactTestUtils.Simulate.change(input, { target: { value: 'third' } });
      }, 400);
    };

    // eslint-disable-next-line
    class LeadingEdgeInput extends React.Component {

      constructor(...params) {
        super(...params);
        this.onChange = this.onChange.bind(this);
      }

      @throttle(undefined, { trailing: false })
      onChange(e) {
        if (this.first) {
          expect(e.target.value).toEqual('first');
          this.first = false;
        } else {
          expect(e.target.value).toEqual('third');
        }
      }

      first = true

      render() {
        return (
          <input
            onChange={this.onChange}
          />
        );
      }
    }

    // eslint-disable-next-line
    class TrailingEdgeInput extends React.Component {

      constructor(...params) {
        super(...params);
        this.onChange = this.onChange.bind(this);
      }

      @throttle(undefined, { leading: false })
      onChange(e) {
        if (this.first) {
          expect(e.target.value).toEqual('second');
          this.first = false;
        } else {
          expect(e.target.value).toEqual('third');
          done();
        }
      }

      first = true

      render() {
        return (
          <input
            onChange={this.onChange}
          />
        );
      }
    }

    // eslint-disable-next-line
    class LeadingAndTrailingEdgeInput extends React.Component {

      constructor(...params) {
        super(...params);
        this.onChange = this.onChange.bind(this);
      }

      @throttle(300)
      onChange(e) {
        if (this.times === 0) {
          expect(e.target.value).toEqual('first');
          this.times++;
        } else if (this.times === 1) {
          expect(e.target.value).toEqual('second');
          this.times++;
        } else {
          expect(e.target.value).toEqual('third');
        }
      }

      times = 0

      render() {
        return (
          <input
            onChange={this.onChange}
          />
        );
      }
    }

    simulateTextInput(LeadingEdgeInput);
    simulateTextInput(LeadingAndTrailingEdgeInput);
    setTimeout(() => {
      simulateTextInput(TrailingEdgeInput);
    }, 500);
  });
});
