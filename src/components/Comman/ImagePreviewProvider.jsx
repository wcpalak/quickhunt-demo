import React, { createContext, useContext, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DialogTitle } from "../ui/dialog";

const ImagePreviewContext = createContext();

export const ImagePreviewProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  const openPreview = useCallback((srcOrList, index = 0) => {
    if (Array.isArray(srcOrList)) {
      setImages(srcOrList);
      setCurrentIndex(index);
    } else {
      setImages([srcOrList]);
      setCurrentIndex(0);
    }
  }, []);

  const closePreview = () => {
    setImages([]);
    setCurrentIndex(null);
  };

  const prevImage = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const nextImage = () =>
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));

  return (
    <ImagePreviewContext.Provider value={{ openPreview }}>
      {children}

      <Dialog open={currentIndex !== null} onOpenChange={closePreview}>
        <DialogContent className="flex flex-col items-center justify-center p-[18px] pt-10 bg-white z-[9999]">
          <DialogTitle className={"hidden"} />
          {images.length > 0 && currentIndex !== null && (
            <>
              <div className="relative w-full flex items-center justify-center overflow-y-auto">
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full shadow"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}

                <img
                  src={images[currentIndex]}
                  alt="Preview"
                  className="max-w-full max-h-[85vh] object-contain rounded"
                />

                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full shadow"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {images.length > 1 && (
                <div className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </ImagePreviewContext.Provider>
  );
};

export const useImagePreview = () => useContext(ImagePreviewContext);
