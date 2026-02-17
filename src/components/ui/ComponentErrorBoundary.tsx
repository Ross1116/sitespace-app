"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "@/lib/monitoring";

type ComponentErrorBoundaryProps = {
  children: ReactNode;
  context?: string;
  title?: string;
  message?: string;
  className?: string;
};

type ComponentErrorBoundaryState = {
  hasError: boolean;
};

export default class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  state: ComponentErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ComponentErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context =
      this.props.context || "ComponentErrorBoundary: component render failure";
    reportError(error, context);
    reportError(errorInfo.componentStack, `${context} (component stack)`);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className={
          this.props.className ||
          "m-2 rounded-xl border border-red-200 bg-red-50 p-5 text-center"
        }
        role="alert"
      >
        <h3 className="text-sm font-semibold text-red-700">
          {this.props.title || "Section unavailable"}
        </h3>
        <p className="mt-1 text-sm text-red-600">
          {this.props.message ||
            "This section failed to render. You can retry without leaving the page."}
        </p>
        <button
          onClick={this.handleReset}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry section
        </button>
      </div>
    );
  }
}
