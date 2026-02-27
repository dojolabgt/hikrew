"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/crop-image";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
}

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageCropperDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCrop = async () => {
        try {
            if (!croppedAreaPixels) return;
            setIsCropping(true);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
            onOpenChange(false);
            // Reset state
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (error) {
            console.error("Error cropping image:", error);
        } finally {
            setIsCropping(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        // Reset state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Recortar Imagen</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Cropper Area */}
                    <div className="relative h-96 bg-muted/30 rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>

                    {/* Zoom Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <ZoomOut className="h-4 w-4" />
                                Zoom
                            </span>
                            <ZoomIn className="h-4 w-4" />
                        </div>
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            min={1}
                            max={3}
                            step={0.1}
                            className="w-full"
                        />
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                        Arrastra para reposicionar • Usa el deslizador para hacer zoom
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={isCropping}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCrop} disabled={isCropping}>
                        {isCropping ? "Recortando..." : "Recortar y Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
