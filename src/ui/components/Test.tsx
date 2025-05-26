import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Test() {
	return (
		<div>
			<h1>test</h1>
		</div>
	);
}

export function Counter() {
	const [count, setCount] = useState(0);
	useEffect(() => {
		console.log("Counter component mounted");
		return () => {
			console.log("Counter component unmounted");
		};
	}, []);
	return (
		<div>
			<label>{count}</label>
			<button onClick={() => setCount(count + 1)}>add</button>
		</div>
	);
}
