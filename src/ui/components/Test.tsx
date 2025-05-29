import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Test() {
	return (
		<div>
			<h1>test</h1>
			<Counter />
		</div>
	);
}

export function Counter() {
	const [count, setCount] = useState(0);
	const ref = useRef("test");
	useEffect(() => {
		console.log("ref: " + ref.current);
	}, [count]);
	return (
		<div>
			<label>{count}</label>
			<button onClick={() => setCount(count + 1)}>add</button>
			<button
				onClick={() => {
					ref.current = "test2";
					console.log("ref: " + ref.current);
				}}
			>
				change ref
			</button>
		</div>
	);
}
