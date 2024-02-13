// Assuming we are using Next.js based on the import paths
"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SyncLoader } from 'react-spinners';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import Download from "yet-another-react-lightbox/plugins/download";

// Define a type for the images stored in state
type CachedImage = string; // Assuming cachedImages are stored as an array of strings (URLs)

export default function MosaicGenerator() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gridNum, setGridNum] = useState<number>(50);
  const [outputWidth, setOutputWidth] = useState<number>(250);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0); // Initialize to the first slide
  const [cachedImages, setCachedImages] = useState<CachedImage[]>([]);

  useEffect(() => {
    // Load cached images from localStorage
    const images: CachedImage[] = JSON.parse(localStorage.getItem('cachedImages') || '[]');
    setCachedImages(images);
  }, []);

  const updateCache = (newImagePath: CachedImage): number => {
    const updatedImages: CachedImage[] = [...cachedImages, newImagePath];
    // Update localStorage and state with new images array
    localStorage.setItem('cachedImages', JSON.stringify(updatedImages));
    setCachedImages(updatedImages);
    return updatedImages.length - 1; // Return the index of the new image
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    const mainImageInput = event.currentTarget.mainImage as HTMLInputElement;
    const tilesInput = event.currentTarget.tiles as HTMLInputElement;

    if (mainImageInput.files) {
      formData.append('mainImage', mainImageInput.files[0]);
    }

    if (tilesInput.files) {
      for (let i = 0; i < tilesInput.files.length; i++) {
        formData.append('tiles', tilesInput.files[i]);
      }
    }

    formData.append('gridNum', String(gridNum));
    formData.append('outputWidth', String(outputWidth));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.path) {
        const newImageIndex = updateCache(result.path);
        setIsLoading(false); // Only stop loading after everything is set
        // No need to set the lightbox index here anymore since it will be set when thumbnail is clicked
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to generate mosaic:', error);
      setIsLoading(false);
    }
  };

  const handleGridNumChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setGridNum(Number(event.target.value));
  };

  const handleOutputWidthChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setOutputWidth(Number(event.target.value));
  };

  // Convert cachedImages to lightbox slides format
  const slides = cachedImages.map(image => ({ src: image }));

  // Correctly open lightbox at the index of the clicked image
  const openLightboxAtIndex = (index: number): void => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="border border-gray-200 rounded-lg shadow-sm p-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label htmlFor="mainImage" className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 w-full aspect-square text-gray-500 text-sm">
              Drop your main image here
              <input type="file" id="mainImage" name="mainImage" required hidden />
            </label>
            <label htmlFor="tiles" className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 w-full aspect-square text-gray-500 text-sm">
              Drop your tile images here
              <input type="file" id="tiles" name="tiles" multiple required hidden />
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="gridNum" className="text-sm font-medium text-gray-500">Grid Number</label>
            <Input id="gridNum" name="gridNum" type="number" defaultValue="10" min="1" max="100" onChange={handleGridNumChange} placeholder="50" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="outputWidth" className="text-sm font-medium text-gray-500">Output Width (px)</label>
            <Input id="outputWidth" name="outputWidth" type="number" defaultValue="250" min="1" max="10000" onChange={handleOutputWidthChange} placeholder="250" />
          </div>
          <Button className="w-full" variant="outline" type="submit">
            Generate Mosaic
          </Button>
        </div>
      </form>
     <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center h-[250px]">
          {isLoading ? (
            <div className="text-center">
              <p>Loading...</p>
              <SyncLoader color="#007bff" size={10} />
            </div>
          ) : (
            <div className="mt-4">
              {cachedImages.map((image, index) => (
                <img key={index} src={image} alt={`Cached Mosaic ${index + 1}`} className="inline-block h-20 mr-2 cursor-pointer" onClick={() => openLightboxAtIndex(index)} />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Lightbox Component */}
      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={slides}
          plugins={[Download,Zoom]}
        />
      )}
    </div>
  );
}

