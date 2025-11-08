"use client";

import * as React from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureSubmit: (signatureDataUrl: string) => void;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSignatureSubmit,
}: SignatureDialogProps) {
  const signatureRef = React.useRef<SignatureCanvas>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 200 });

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSubmit = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      onSignatureSubmit(dataUrl);
      onOpenChange(false);
      // Clear after submission
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      setIsEmpty(signatureRef.current.isEmpty());
    }
  };

  // Calculate canvas dimensions to match container size exactly
  // This fixes the cursor offset issue by ensuring canvas internal size matches display size
  React.useEffect(() => {
    if (open && containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Get the actual pixel dimensions of the container
          // The container should already be constrained by w-full and parent max-width
          const containerWidth = Math.max(Math.floor(rect.width), 300); // Minimum width
          const containerHeight = Math.max(Math.floor(containerWidth / 3), 100); // Maintain 3:1 ratio
          
          // Only update if dimensions actually changed
          setDimensions((prev) => {
            if (prev.width !== containerWidth || prev.height !== containerHeight) {
              return { width: containerWidth, height: containerHeight };
            }
            return prev;
          });
        }
      };

      // Use ResizeObserver for accurate size tracking
      let resizeObserver: ResizeObserver | null = null;
      
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          // Small delay to ensure dialog animation is complete
          requestAnimationFrame(() => {
            setTimeout(updateDimensions, 100);
          });
        });
        resizeObserver.observe(containerRef.current);
      }
      
      // Initial update after dialog is fully rendered
      // Multiple timeouts to account for dialog animation
      const timer1 = setTimeout(updateDimensions, 100);
      const timer2 = setTimeout(updateDimensions, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [open]);

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open && signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Semnează cererea</DialogTitle>
          <DialogDescription>
            Desenează semnătura ta în caseta de mai jos
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div
            ref={containerRef}
            className="relative w-full border-2 border-border rounded-lg bg-white overflow-hidden touch-none flex items-center justify-center"
            style={{ 
              aspectRatio: "3/1", 
              minHeight: "200px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: "cursor-crosshair touch-none",
                width: dimensions.width,
                height: dimensions.height,
                style: {
                  touchAction: "none",
                  // Don't scale with CSS - let canvas render at natural size
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                },
              }}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 0)"
              velocityFilterWeight={0.7}
              onBegin={handleBegin}
              onEnd={handleEnd}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground">
                  Desenează semnătura ta aici
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Șterge
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty}
            className="bg-[#FF008C] hover:bg-[#E6007A] text-white"
          >
            Trimite semnătura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

