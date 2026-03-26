import pdf from "pdf-parse/lib/pdf-parse.js";

// Minimal polyfills needed by pdf-parse in Node runtime.
type PromiseWithResolvers = PromiseConstructor & {
    withResolvers?: <T>() => {
        promise: Promise<T>;
        resolve: (value: T | PromiseLike<T>) => void;
        reject: (reason?: unknown) => void;
    };
};

const promiseConstructor = Promise as PromiseWithResolvers;
if (!promiseConstructor.withResolvers) {
    promiseConstructor.withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

const runtimeGlobals = globalThis as unknown as Record<string, unknown>;

if (typeof runtimeGlobals.DOMMatrix === "undefined") runtimeGlobals.DOMMatrix = class { };
if (typeof runtimeGlobals.ImageData === "undefined") runtimeGlobals.ImageData = class { };
if (typeof runtimeGlobals.Path2D === "undefined") runtimeGlobals.Path2D = class { };

export async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF");
    }
}
