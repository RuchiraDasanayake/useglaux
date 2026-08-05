import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError: () => void;
}

interface State {
  failed: boolean;
}

/**
 * Keeps an optional WebGL enhancement from taking down the marketing page.
 * The poster already occupies the same layer, so rendering nothing is the
 * correct fallback for chunk, shader, model, and context-creation failures.
 */
export default class Hero3DErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
