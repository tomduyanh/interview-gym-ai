import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"

export function ResumeUpload({ onChange }: { onChange: (file: File | null) => void }) {
    return (
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="resume">Resume (PDF)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag and drop your PDF here, or click to select</p>
                    <Input
                        id="resume"
                        type="file"
                        accept=".pdf"
                        className="cursor-pointer"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            onChange(file);
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
