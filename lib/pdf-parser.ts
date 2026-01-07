// Polyfill for pdf-parse in Node.js environment
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

// @ts-ignore
if (!global.DOMMatrix) global.DOMMatrix = class { };
// @ts-ignore
if (!global.ImageData) global.ImageData = class { };
// @ts-ignore
if (!global.DOMMatrix) global.DOMMatrix = class { };
// @ts-ignore
if (!global.ImageData) global.ImageData = class { };
// @ts-ignore
if (!global.Path2D) global.Path2D = class { };

const pdf = require('pdf-parse/lib/pdf-parse.js');

console.log("PDF PARSER IMPORT:", typeof pdf, pdf); // Debug log

export async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF");
    }
}
