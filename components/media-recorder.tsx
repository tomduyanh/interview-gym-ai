'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video, Square, Loader2, Mic } from 'lucide-react'
import { transcribeAudioAction } from '@/app/actions'
import { Card } from '@/components/ui/card'

interface AnswerRecorderProps {
    onTranscriptionComplete: (text: string) => void
}

export function AnswerRecorder({ onTranscriptionComplete }: AnswerRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Build cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    const startRecording = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 640, height: 480, facingMode: "user" }
            })
            setStream(newStream)

            // Connect stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = newStream
            }

            const mediaRecorder = new window.MediaRecorder(newStream, { mimeType: 'video/webm' })
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' })
                await handleTranscription(blob)

                // Stop all tracks
                newStream.getTracks().forEach(track => track.stop())
                setStream(null)
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error accessing camera/microphone:", err)
            alert("Could not access camera/microphone. Please allow permissions.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsTranscribing(true)
        }
    }

    const handleTranscription = async (blob: Blob) => {
        try {
            const formData = new FormData()
            formData.append('audio', blob, 'recording.webm') // The backend expects 'audio' field but handles the file

            const result = await transcribeAudioAction(formData)

            if (result.success && result.text) {
                onTranscriptionComplete(result.text)
            } else {
                console.error("Transcription failed:", result.error)
                alert("Failed to transcribe audio from video.")
            }
        } catch (error) {
            console.error("Error sending media:", error)
            alert("Error sending media to server.")
        } finally {
            setIsTranscribing(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Video Preview */}
            {(isRecording || stream) && (
                <Card className="overflow-hidden border-2 border-primary/20 bg-black/5 w-full max-w-md aspect-video relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-white font-medium bg-black/50 px-2 py-0.5 rounded">REC</span>
                    </div>
                </Card>
            )}

            <div className="flex items-center gap-2">
                {!isRecording ? (
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={startRecording}
                        disabled={isTranscribing}
                        className="gap-2 min-w-[200px]"
                    >
                        {isTranscribing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Transcribing...
                            </>
                        ) : (
                            <>
                                <Video className="h-4 w-4" />
                                Record Answer (Video)
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        size="default"
                        onClick={stopRecording}
                        className="gap-2 min-w-[200px] animate-pulse"
                    >
                        <Square className="h-4 w-4 fill-current" />
                        Stop Recording
                    </Button>
                )}
            </div>
        </div>
    )
}
