import React, { JSX } from "react";
import { Button, Dialog, DialogTrigger, Heading, Modal, Pressable } from "react-aria-components";

export interface IModalDialogData {
	title: string;
	isError?: boolean;
	body: JSX.Element;
}

export interface IModalDialogProps {
	isOpen: boolean;
	data: IModalDialogData | null;
}

export function ModalDialog(props: IModalDialogProps) {
	return (
		<Modal
			isOpen={props.isOpen}
			style={{ borderColor: props.data?.isError ? "var(--highlight-background-invalid)" : "" }}
		>
			<Dialog>
				<Heading slot="title">{props.data?.title}</Heading>
				{props.data?.body}
			</Dialog>
		</Modal>
	);
}
