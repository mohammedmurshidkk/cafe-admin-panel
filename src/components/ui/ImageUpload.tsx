import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    value?: string;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    disabled?: boolean;
    className?: string;
}

export const ImageUpload = ({
    value,
    onChange,
    onRemove,
    disabled,
    className,
}: ImageUploadProps) => {
    const [preview, setPreview] = useState<string | null>(value || null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                setPreview(URL.createObjectURL(file));
                onChange(file);
            }
        },
        [onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
        },
        maxFiles: 1,
        multiple: false,
        disabled: disabled || !!preview,
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange(null);
        if (onRemove) onRemove();
    };

    return (
        <div className={cn('space-y-4 w-full', className)}>
            <div
                {...getRootProps()}
                className={cn(
                    'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-6 bg-muted/30 hover:bg-muted/50 border-muted-foreground/20',
                    isDragActive && 'border-primary bg-primary/5',
                    disabled && 'opacity-50 cursor-not-allowed',
                    preview && 'border-none p-0 bg-transparent'
                )}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                        <img
                            src={preview}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleRemove}
                                className="h-10 w-10 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <UploadCloud className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">
                                {isDragActive ? 'Drop image here' : 'Click or drag image to upload'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG, GIF or WEBP (Max 5MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
