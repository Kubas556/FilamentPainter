import { createContext } from "react";
import { IModalDialogData } from "./components/ModalDialog";

export const ModalDialogContext = createContext<
	(dialogDataCallback: (closeHandler: () => void) => IModalDialogData) => void
>(() => {});
