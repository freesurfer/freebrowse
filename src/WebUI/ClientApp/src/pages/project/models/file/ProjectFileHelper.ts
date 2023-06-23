export const convertFileToBase64 = async (file: File): Promise<string> => {
	return await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			if (reader.result === null) {
				reject(new Error('result is null'));
				return;
			}
			if (reader.result instanceof ArrayBuffer) {
				reject(
					new Error('result is an ArrayBuffer instead of expected string')
				);
				return;
			}
			const arr = reader.result.split(',');
			const base64 = arr[arr.length - 1];
			if (base64 === undefined) {
				reject(new Error('not possible'));
				return;
			}

			resolve(base64);
		};
		reader.onerror = (error) => {
			reject(error);
		};
	});
};
