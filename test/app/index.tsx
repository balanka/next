import React, { ReactElement } from "react";
import ReactDOM from "react-dom";
import Test from "../../src/components/Test";

function App(): ReactElement {
    return (
        <div>
            <h4>If you're seeing this, it's working!</h4>
            <Test name="John" age={0} />
        </div>
    );
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.querySelector("#root"),
);
