import React, { useState, useCallback } from "react";
import { Perlin, NotificationTypes } from "../../Perlin";
// @ts-ignore
import Worker from "./generate-keys.worker";

const worker = new Worker();

const workerGenerateKey = (c1: number) => {
    return new Promise(resolve => {
        worker.onmessage = (evt: any) => {
            const { type, data } = evt.data;

            if (type === "newKeys") {
                resolve(data as any);
            }
        };
        worker.postMessage({
            type: "generateKeys",
            c1
        });
    });
};

const usePrivateKey = (errorNotification: any, defaultKey: string = "") => {
    const [privateKey, setPrivateKey] = useState<string>(defaultKey);
    const handleFileChange = useCallback((e: any) => {
        try {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                if (file.type !== "text/plain") {
                    errorNotification(
                        `File Type ${file.type} is not supported.`
                    );
                } else {
                    const fileReader = new FileReader();
                    fileReader.onloadend = (readerEvent: any) => {
                        if (typeof fileReader.result === "string") {
                            setPrivateKey(fileReader.result);
                        } else {
                            errorNotification(
                                "Can't parse string from the file."
                            );
                        }
                    };
                    fileReader.readAsText(file);
                }
            }
        } catch (err) {
            errorNotification(err);
        }
    }, []);

    const generateNewKeys = async () => {
        const generatedKeys: any = await workerGenerateKey(1);
        const secretKey = Buffer.from(generatedKeys.secretKey).toString("hex");
        setPrivateKey(secretKey);
    };

    const handleChange = useCallback((e: any) => {
        setPrivateKey(e.target.value);
    }, []);

    const downloadKey = useCallback(() => {
        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," +
                encodeURIComponent(privateKey || "")
        );
        element.setAttribute("download", "private-key.txt");

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }, [privateKey]);

    return {
        setPrivateKey,
        generateNewKeys,
        privateKey,
        downloadKey,
        handleFileChange,
        handleChange
    };
};

export default usePrivateKey;
