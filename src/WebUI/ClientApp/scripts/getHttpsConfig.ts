"use strict";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";

// Ensure the certificate and key provided are valid and if not
// throw an easy to debug error
function validateKeyAndCerts({ cert, key, keyFile, crtFile }) {
	let encrypted;
	try {
		// publicEncrypt will throw an error with an invalid cert
		encrypted = crypto.publicEncrypt(cert, Buffer.from("test"));
	} catch (err) {
		throw new Error(
			`The certificate "${chalk.yellow(crtFile)}" is invalid.\n${err.message}`
		);
	}

	try {
		// privateDecrypt will throw an error with an invalid key
		crypto.privateDecrypt(key, encrypted);
	} catch (err) {
		throw new Error(
			`The certificate key "${chalk.yellow(keyFile)}" is invalid.\n${
				err.message
			}`
		);
	}
}

// Read file and throw an error if it doesn't exist
function readEnvFile(file, type) {
	if (!fs.existsSync(file)) {
		throw new Error(
			`You specified ${chalk.cyan(
				type
			)} in your env, but the file "${chalk.yellow(file)}" can't be found.`
		);
	}
	return fs.readFileSync(file);
}

// Get the https config
// Return cert files if provided in env, otherwise just true or false
export const getHttpsConfig = () => {
	const { VITE_SSL_CRT_FILE, VITE_SSL_KEY_FILE, VITE_HTTPS } = process.env;
	const isHttps = VITE_HTTPS === "true";

	if (isHttps && VITE_SSL_CRT_FILE && VITE_SSL_KEY_FILE) {
		const crtFile = path.resolve("..", VITE_SSL_CRT_FILE);
		const keyFile = path.resolve("..", VITE_SSL_KEY_FILE);
		const config = {
			cert: readEnvFile(crtFile, "VITE_SSL_CRT_FILE"),
			key: readEnvFile(keyFile, "VITE_SSL_KEY_FILE"),
		};

		validateKeyAndCerts({ ...config, keyFile, crtFile });
		return config;
	}
	return isHttps;
};
