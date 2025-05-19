import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Test() {
    return (<div>
        {createPortal(<Counter />, document.getElementById("copy") as HTMLElement)}
    </div>)
}

export function Counter() {
    const [count, setCount] = useState(0);
    return (<div>
        <label>{count}</label>
        <button onClick={() => setCount(count + 1)}>add</button>
    </div>)
}