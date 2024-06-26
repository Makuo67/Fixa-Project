import React from "react";
import ErrorComponent from "./Error";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service 
        console.log({error, errorInfo});
    }
    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <ErrorComponent status={500} back={false} />;
        }   
        return this.props.children;
    }
}

export default ErrorBoundary