// ui/src/hooks/useRecorder.ts
import { useEffect, useRef, useState } from "react";

export function useRecorder() {
    const mediaRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const [recording, setRecording] = useState(false);

    useEffect(() => {
        return () => {
            if (mediaRef.current && mediaRef.current.state !== "inactive") {
                mediaRef.current.stop();
            }
        };
    }, []);

    async function start() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];
        mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        mr.start();
        mediaRef.current = mr;
        setRecording(true);
    }

    async function stop(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!mediaRef.current) return resolve(new Blob());
            mediaRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                resolve(blob);
                setRecording(false);
            };
            mediaRef.current.stop();
        });
    }

    return { start, stop, recording };
}
