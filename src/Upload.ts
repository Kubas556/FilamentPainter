export interface ImageUpload {
	file: File | null;
	imageElement: HTMLImageElement | null;
	error: string | null;
}

export async function handleImageUploadAsync(
	e: React.ChangeEvent<HTMLInputElement>,
	callback: (result: ImageUpload) => void,
): Promise<void> {
	const target = e.target;
	const file = target.files?.[0];

	callback(await readImageFromFileAsync(file));
}

export function readImageFromFileAsync(file: File | undefined): Promise<ImageUpload> {
	return new Promise((resolve) => {
		if (!file) {
			resolve({ file: null, imageElement: null, error: "No file selected." });
			return;
		}

		if (!file.type.startsWith("image/")) {
			resolve({ file: null, imageElement: null, error: "Selected file is not an image." });
			return;
		}

		const reader = new FileReader();

		reader.onload = (readEvent) => {
			const dataUrl = readEvent.target?.result as string;
			getImageFromStringAsync(dataUrl).then((result) => {
				resolve({ file, imageElement: result.imageElement, error: result.error });
			});
		};

		reader.onerror = () => {
			resolve({ file, imageElement: null, error: "Error reading the file." });
		};

		reader.readAsDataURL(file);
	});
}

export function getImageFromStringAsync(data: string) {
	return new Promise<ImageUpload>((resolve) => {
		const img = new Image();

		img.onload = () => {
			resolve({ file: null, imageElement: img, error: null });
		};

		img.onerror = () => {
			resolve({ file: null, imageElement: null, error: "Error loading the image from string." });
		};

		img.src = data;
	});
}
