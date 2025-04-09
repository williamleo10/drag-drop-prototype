"use client";
import { useState, useEffect, useRef, MouseEvent } from "react";

// Define interfaces for your data structures
interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  color: string;
  imageData: string | null;
}

interface Layer {
  id: number;
  type: "frame" | "photo";
  name: string;
  visible: boolean;
  zIndex: number;
  locked: boolean;
  photoId?: number; // Optional since frame layers don't have this
}

interface FrameImage {
  name: string;
  imageData: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface HistoryState {
  framePos: Position;
  frameSize: Size;
  layers: Layer[];
  photos: Photo[];
  frameImage: FrameImage | null;
}

export default function DSLRBoothCompleteEditor() {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState<Size>({ width: 276, height: 828 });
  const [frameImage, setFrameImage] = useState<FrameImage | null>(null);
  const [framePos, setFramePos] = useState<Position>({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState<Size>({ width: 276, height: 828 });
  const [layers, setLayers] = useState<Layer[]>([
    { id: 1, type: "frame", name: "Frame", visible: true, zIndex: 1, locked: false }
  ]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoImages, setPhotoImages] = useState<Record<number, string>>({});
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [nextPhotoId, setNextPhotoId] = useState<number>(1);
  const [nextLayerId, setNextLayerId] = useState<number>(2);

  // History states for undo/redo functionality
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Colors for photo placeholder
  const photoColors = [
    "#FF4747", "#9ACD32", "#4169E1", "#FFA500",
    "#8A2BE2", "#20B2AA", "#FF69B4", "#FF8C00"
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      renderCanvas();
    }
  }, [isClient, canvasSize, frameImage, framePos, frameSize, layers, photos, photoImages, selectedLayerId]);

  // Add a new state to history
  const addToHistory = () => {
    // Create a deep copy of the current state
    const currentState: HistoryState = {
      framePos: { ...framePos },
      frameSize: { ...frameSize },
      layers: JSON.parse(JSON.stringify(layers)),
      photos: JSON.parse(JSON.stringify(photos)),
      // Fix: Handle frameImage properly for history
      frameImage: frameImage ? {
        name: frameImage.name,
        imageData: frameImage.imageData
      } : null
    };

    // If we're not at the end of the history, remove future states
    if (historyIndex < history.length - 1) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
    } else {
      // Otherwise, just append to the history
      setHistory([...history, currentState]);
    }

    // Set the index to the end
    setHistoryIndex(historyIndex + 1);
  };

  // Handle undo operation
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFramePos(prevState.framePos);
      setFrameSize(prevState.frameSize);
      setLayers(prevState.layers);
      setPhotos(prevState.photos);
      setFrameImage(prevState.frameImage);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Handle redo operation
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setFramePos(nextState.framePos);
      setFrameSize(nextState.frameSize);
      setLayers(nextState.layers);
      setPhotos(nextState.photos);
      setFrameImage(nextState.frameImage);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Center the selected layer on the canvas
  const centerSelectedLayer = () => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    if (selectedLayer.type === "photo" && selectedLayer.photoId !== undefined) {
      const photoId = selectedLayer.photoId;
      const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
          };
        }
        return photo;
      });

      setPhotos(updatedPhotos);
      addToHistory();
    }
    else if (selectedLayer.type === "frame") {
      setFramePos({
        x: (canvasSize.width - frameSize.width) / 2,
        y: (canvasSize.height - frameSize.height) / 2
      });
      addToHistory();
    }
  };

  // Toggle lock state for the selected layer
  const toggleLockSelectedLayer = () => {
    if (!selectedLayerId) return;

    const updatedLayers = layers.map(layer => {
      if (layer.id === selectedLayerId) {
        return { ...layer, locked: !layer.locked };
      }
      return layer;
    });

    setLayers(updatedLayers);
    addToHistory();
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sort layers by zIndex and draw them
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach(layer => {
      if (!layer.visible) return;

      if (layer.type === "frame") {
        // Draw frame
        if (!frameImage) {
          // Placeholder if no frame image is loaded
          ctx.strokeStyle = "#CCCCCC";
          ctx.strokeRect(framePos.x, framePos.y, frameSize.width, frameSize.height);
          ctx.fillStyle = "#F0F0F0";
          ctx.fillRect(framePos.x, framePos.y, frameSize.width, frameSize.height);

          ctx.fillStyle = "#999999";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Import frame using 'Image' button", canvasSize.width / 2, canvasSize.height / 2);
        } else if (frameImage.imageData) {
          // Draw actual frame image if available
          const img = new Image();
          img.src = frameImage.imageData;
          ctx.drawImage(img, framePos.x, framePos.y, frameSize.width, frameSize.height);
        } else {
          // Fallback to placeholder
          ctx.fillStyle = "#F5F5DC"; // Beige-like color
          ctx.fillRect(framePos.x, framePos.y, frameSize.width, frameSize.height);

          // Draw a border to represent the frame
          ctx.strokeStyle = "#8B4513"; // SaddleBrown
          ctx.lineWidth = 10;
          ctx.strokeRect(framePos.x + 5, framePos.y + 5, frameSize.width - 10, frameSize.height - 10);

          // Add some pattern to make it look like a frame
          ctx.strokeStyle = "#D2B48C"; // Tan
          ctx.lineWidth = 2;
          for (let i = 20; i < frameSize.width - 20; i += 20) {
            ctx.beginPath();
            ctx.moveTo(framePos.x + i, framePos.y + 10);
            ctx.lineTo(framePos.x + i, framePos.y + frameSize.height - 10);
            ctx.stroke();
          }

          // Show frame name
          ctx.fillStyle = "#000000";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            frameImage.name ? frameImage.name.substring(0, 20) : "Frame",
            framePos.x + frameSize.width / 2,
            framePos.y + 20
          );
        }

        // Highlight if selected
        if (layer.id === selectedLayerId) {
          // Use a different color for locked layers
          ctx.strokeStyle = layer.locked ? "#FF6B00" : "#00AAFF";
          ctx.lineWidth = 2;
          ctx.strokeRect(framePos.x - 2, framePos.y - 2, frameSize.width + 4, frameSize.height + 4);

          // Draw lock icon if locked
          if (layer.locked) {
            ctx.font = "16px Arial";
            ctx.fillStyle = "#FF6B00";
            ctx.fillText("🔒", framePos.x + 15, framePos.y + 15);
          }
        }
      }
      else if (layer.type === "photo" && layer.photoId !== undefined) {
        const photo = photos.find(p => p.id === layer.photoId);
        if (!photo) return;

        ctx.save();

        // Apply transformations for this photo
        ctx.translate(photo.x, photo.y);
        ctx.rotate(photo.rotation * Math.PI / 180);
        ctx.scale(photo.scale, photo.scale);

        // Check if we have image data for this photo
        if (photo.imageData) {
          // Draw the actual photo
          const img = new Image();
          img.src = photo.imageData;
          ctx.drawImage(
            img,
            -photo.width / 2,
            -photo.height / 2,
            photo.width,
            photo.height
          );
        } else {
          // Draw placeholder if no image is available
          ctx.fillStyle = photo.color;
          ctx.fillRect(-photo.width / 2, -photo.height / 2, photo.width, photo.height);

          // Draw photo number
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(photo.id.toString(), 0, 0);
        }

        // Draw border and handles if selected
        if (layer.id === selectedLayerId) {
          // Use a different color for locked layers
          ctx.strokeStyle = layer.locked ? "#FF6B00" : "#FF0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -photo.width / 2 - 2,
            -photo.height / 2 - 2,
            photo.width + 4,
            photo.height + 4
          );

          // Draw lock icon if locked
          if (layer.locked) {
            ctx.fillStyle = "#FF6B00";
            ctx.fillText("🔒", 0, -photo.height / 2 - 15);
          } else {
            // Resize handles on corners (only if not locked)
            ctx.fillStyle = "#FF0000";
            const handleSize = 8;

            // Top-left handle
            ctx.fillRect(
              -photo.width / 2 - handleSize / 2,
              -photo.height / 2 - handleSize / 2,
              handleSize,
              handleSize
            );

            // Top-right handle
            ctx.fillRect(
              photo.width / 2 - handleSize / 2,
              -photo.height / 2 - handleSize / 2,
              handleSize,
              handleSize
            );

            // Bottom-left handle
            ctx.fillRect(
              -photo.width / 2 - handleSize / 2,
              photo.height / 2 - handleSize / 2,
              handleSize,
              handleSize
            );

            // Bottom-right handle
            ctx.fillRect(
              photo.width / 2 - handleSize / 2,
              photo.height / 2 - handleSize / 2,
              handleSize,
              handleSize
            );
          }
        }

        ctx.restore();
      }
    });
  };

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if we clicked on anything
    let clickedLayerId: number | null = null;

    // Start from the topmost layer (highest zIndex) and work backwards
    const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      if (layer.type === "photo" && layer.photoId !== undefined) {
        const photo = photos.find(p => p.id === layer.photoId);
        if (!photo) continue;

        // Simple rectangular hit-testing (doesn't account for rotation)
        const halfWidth = (photo.width * photo.scale) / 2;
        const halfHeight = (photo.height * photo.scale) / 2;

        if (
          x >= photo.x - halfWidth &&
          x <= photo.x + halfWidth &&
          y >= photo.y - halfHeight &&
          y <= photo.y + halfHeight
        ) {
          clickedLayerId = layer.id;
          break;
        }
      }
      else if (layer.type === "frame") {
        if (
          x >= framePos.x &&
          x <= framePos.x + frameSize.width &&
          y >= framePos.y &&
          y <= framePos.y + frameSize.height
        ) {
          clickedLayerId = layer.id;
          break;
        }
      }
    }

    setSelectedLayerId(clickedLayerId);
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    // Don't start dragging if the layer is locked
    if (selectedLayer.locked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    // Don't move if the layer is locked
    if (selectedLayer.locked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (selectedLayer.type === "photo" && selectedLayer.photoId !== undefined) {
      const photoId = selectedLayer.photoId;
      const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            x: photo.x + deltaX,
            y: photo.y + deltaY
          };
        }
        return photo;
      });

      setPhotos(updatedPhotos);
    }
    else if (selectedLayer.type === "frame") {
      setFramePos({
        x: framePos.x + deltaX,
        y: framePos.y + deltaY
      });
    }

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Only add to history if something was actually dragged
      addToHistory();
    }
    setIsDragging(false);
  };

  const addPhotoFromBooth = () => {
    if (photos.length >= 8) {
      alert("Maximum 8 photos allowed.");
      return;
    }

    const newPhotoId = nextPhotoId;

    // Calculate default position (center of canvas)
    const x = canvasSize.width / 2;
    const y = canvasSize.height / 2;

    // Create new photo
    const newPhoto: Photo = {
      id: newPhotoId,
      x,
      y,
      width: 100,
      height: 75,
      rotation: 0,
      scale: 1,
      color: photoColors[(newPhotoId - 1) % photoColors.length],
      imageData: null
    };

    // Create new layer for this photo
    const newLayer: Layer = {
      id: nextLayerId,
      type: "photo",
      name: `Photo ${newPhotoId}`,
      visible: true,
      zIndex: layers.length + 1, // Place on top
      photoId: newPhotoId,
      locked: false
    };

    const updatedPhotos = [...photos, newPhoto];
    const updatedLayers = [...layers, newLayer];

    setPhotos(updatedPhotos);
    setLayers(updatedLayers);
    setSelectedLayerId(nextLayerId);
    setNextPhotoId(newPhotoId + 1);
    setNextLayerId(nextLayerId + 1);

    // Add to history
    addToHistory();
  };

  const uploadFrame = () => {
    frameInputRef.current?.click();
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') return;

      // Update frame image with data
      setFrameImage({
        name: file.name,
        imageData: result
      });

      // Add to history after loading
      setTimeout(() => addToHistory(), 100);
    };

    reader.readAsDataURL(file);

    // Reset the input
    e.target.value = "";
  };

  const uploadPhotoImage = () => {
    const selectedLayer = selectedLayerId ? layers.find(l => l.id === selectedLayerId) : null;
    if (!selectedLayer || selectedLayer.type !== "photo") {
      alert("Please select a photo layer first.");
      return;
    }

    photoInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const selectedLayer = selectedLayerId ? layers.find(l => l.id === selectedLayerId) : null;
    if (!selectedLayer || selectedLayer.type !== "photo" || selectedLayer.photoId === undefined) return;

    const photoId = selectedLayer.photoId;

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') return;

      // Update photo with image data
      const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            imageData: result
          };
        }
        return photo;
      });

      setPhotos(updatedPhotos);

      // Add to history after loading
      setTimeout(() => addToHistory(), 100);
    };

    reader.readAsDataURL(file);

    // Reset the input
    e.target.value = "";
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    // Remove layer without restrictions
    const updatedLayers = layers.filter(l => l.id !== selectedLayerId);

    // Also remove the photo if it's a photo layer
    let updatedPhotos = [...photos];
    if (selectedLayer.type === "photo" && selectedLayer.photoId !== undefined) {
      updatedPhotos = photos.filter(p => p.id !== selectedLayer.photoId);
    }

    setLayers(updatedLayers);
    setPhotos(updatedPhotos);

    // Select another layer if available
    if (updatedLayers.length > 0) {
      setSelectedLayerId(updatedLayers[updatedLayers.length - 1].id);
    } else {
      setSelectedLayerId(null);
    }

    // Add to history
    addToHistory();
  };

  const toggleLayerVisibility = (layerId: number) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    });

    setLayers(updatedLayers);
    addToHistory();
  };

  const moveLayerToTop = (layerId: number) => {
    const layerToMove = layers.find(l => l.id === layerId);
    if (!layerToMove) return;

    // Find the highest zIndex
    const highestZIndex = Math.max(...layers.map(l => l.zIndex));

    // Only update if not already at the top
    if (layerToMove.zIndex < highestZIndex) {
      const updatedLayers = layers.map(layer => {
        if (layer.id === layerId) {
          return { ...layer, zIndex: highestZIndex + 1 };
        }
        return layer;
      });

      setLayers(updatedLayers);
      addToHistory();
    }
  };

  const moveLayerToBottom = (layerId: number) => {
    const layerToMove = layers.find(l => l.id === layerId);
    if (!layerToMove) return;

    // Find the lowest zIndex
    const lowestZIndex = Math.min(...layers.map(l => l.zIndex));

    // Only update if not already at the bottom
    if (layerToMove.zIndex > lowestZIndex) {
      const updatedLayers = layers.map(layer => {
        if (layer.id === layerId) {
          return { ...layer, zIndex: lowestZIndex - 1 };
        }
        return layer;
      });

      setLayers(updatedLayers);
      addToHistory();
    }
  };

  const rotateSelectedPhoto = (degrees: number) => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo" || selectedLayer.locked || selectedLayer.photoId === undefined) return;

    const photoId = selectedLayer.photoId;
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          rotation: (photo.rotation + degrees) % 360
        };
      }
      return photo;
    });

    setPhotos(updatedPhotos);
    addToHistory();
  };

  const scaleSelectedPhoto = (factor: number) => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo" || selectedLayer.locked || selectedLayer.photoId === undefined) return;

    const photoId = selectedLayer.photoId;
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          scale: Math.max(0.1, Math.min(5, photo.scale * factor))
        };
      }
      return photo;
    });

    setPhotos(updatedPhotos);
    addToHistory();
  };

  const resizeCanvas = () => {
    const widthStr = prompt("Enter canvas width (pixels):", canvasSize.width.toString());
    const heightStr = prompt("Enter canvas height (pixels):", canvasSize.height.toString());

    if (!widthStr || !heightStr) return;

    const width = parseInt(widthStr);
    const height = parseInt(heightStr);

    if (width > 0 && height > 0) {
      setCanvasSize({ width, height });
      // Also resize the frame to match
      setFrameSize({ width, height });
      addToHistory();
    }
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");

    // Create link and trigger download
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "photobooth-frame.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all photos?")) {
      // Keep only the frame layer
      const frameLayer = layers.find(l => l.type === "frame");
      if (frameLayer) {
        setLayers([frameLayer]);
        setPhotos([]);
        setSelectedLayerId(frameLayer.id);
      } else {
        setLayers([]);
        setPhotos([]);
        setSelectedLayerId(null);
      }

      addToHistory();
    }
  };

  const addNewFrameLayer = () => {
    const newFrameLayer: Layer = {
      id: nextLayerId,
      type: "frame",
      name: "New Frame",
      visible: true,
      zIndex: layers.length + 1, // Place on top
      locked: false
    };

    setLayers([...layers, newFrameLayer]);
    setSelectedLayerId(nextLayerId);
    setNextLayerId(nextLayerId + 1);

    addToHistory();
  };

  // Initialize history with the initial state
  useEffect(() => {
    if (isClient && history.length === 0) {
      addToHistory();
    }
  }, [isClient]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isClient) return null;

  // Create a scale factor for the display (to make tall canvas fit in viewport)
  const canvasDisplayScale = Math.min(1, 500 / canvasSize.height);

  // Check if selected layer is locked
  const isSelectedLayerLocked = (() => {
    const selectedLayer = selectedLayerId ? layers.find(l => l.id === selectedLayerId) : null;
    return selectedLayer ? selectedLayer.locked : false;
  })();

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Left Sidebar - Add Tools */}
        <div className="w-52 bg-gray-800 border-r border-gray-700 min-h-screen">
          <div className="p-2 bg-gray-700 font-bold">Add</div>

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={addPhotoFromBooth}
          >
            <span className="mr-2">📸</span>
            <span>Photo From Booth</span>
          </div>

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={uploadFrame}
          >
            <span className="mr-2">🖼️</span>
            <span>Image</span>
          </div>
          <input
            type="file"
            ref={frameInputRef}
            onChange={handleFrameUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={addNewFrameLayer}
          >
            <span className="mr-2">🔲</span>
            <span>Add Frame Layer</span>
          </div>

          <div className="p-2 bg-gray-700 font-bold mt-4">Canvas</div>

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={resizeCanvas}
          >
            <span className="mr-2">📏</span>
            <span>Resize Canvas</span>
          </div>

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={clearAll}
          >
            <span className="mr-2">🗑️</span>
            <span>Clear All</span>
          </div>

          <div
            className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
            onClick={exportCanvas}
          >
            <span className="mr-2">💾</span>
            <span>Export</span>
          </div>

          <div className="p-2 bg-gray-700 font-bold mt-4">Edit</div>

          <div
            className={`p-3 border-b border-gray-700 ${canUndo ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'} flex items-center`}
            onClick={canUndo ? handleUndo : undefined}
          >
            <span className="mr-2">↩️</span>
            <span>Undo</span>
          </div>

          {/* Fixed: Changed from duplicate Undo to Redo */}
          <div
            className={`p-3 border-b border-gray-700 ${canRedo ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'} flex items-center`}
            onClick={canRedo ? handleRedo : undefined}
          >
            <span className="mr-2">↪️</span>
            <span>Redo</span>
          </div>

          {/* Lock/Unlock Selected Layer */}
          <div
            className={`p-3 border-b border-gray-700 ${selectedLayerId ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'} flex items-center`}
            onClick={selectedLayerId ? toggleLockSelectedLayer : undefined}
          >
            <span className="mr-2">{isSelectedLayerLocked ? '🔓' : '🔒'}</span>
            <span>{isSelectedLayerLocked ? 'Unlock Layer' : 'Lock Layer'}</span>
          </div>

          {/* Center Selected Layer */}
          <div
            className={`p-3 border-b border-gray-700 ${selectedLayerId ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'} flex items-center`}
            onClick={selectedLayerId ? centerSelectedLayer : undefined}
          >
            <span className="mr-2">📍</span>
            <span>Align Center</span>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-gray-900 p-4 flex flex-col items-center justify-center">
          <div className="bg-gray-800 p-3 mb-4 text-center">
            <span className="font-bold">Canvas Size: {canvasSize.width} × {canvasSize.height} px</span>
          </div>

          <div className="relative mb-4 bg-gray-800 p-4 overflow-auto">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="bg-gray-300"
              style={{
                width: canvasSize.width * canvasDisplayScale,
                height: canvasSize.height * canvasDisplayScale,
                cursor: isDragging ? "grabbing" : (isSelectedLayerLocked ? "not-allowed" : "grab")
              }}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
              onClick={addPhotoFromBooth}
              disabled={photos.length >= 8}
            >
              Add Photo {nextPhotoId}
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              onClick={deleteSelectedLayer}
              disabled={!selectedLayerId || isSelectedLayerLocked}
            >
              Delete Selected
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              onClick={exportCanvas}
            >
              Export Image
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded"
              onClick={centerSelectedLayer}
              disabled={!selectedLayerId}
            >
              Center
            </button>
            <button
              className="bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded"
              onClick={toggleLockSelectedLayer}
              disabled={!selectedLayerId}
            >
              {isSelectedLayerLocked ? 'Unlock' : 'Lock'}
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              className={`bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleUndo}
              disabled={!canUndo}
            >
              ↩️ Undo
            </button>
            <button
              className={`bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleRedo}
              disabled={!canRedo}
            >
              ↪️ Redo
            </button>
          </div>

          {selectedLayerId && layers.find(l => l.id === selectedLayerId)?.type === "photo" && (
            <div className="flex gap-3 mt-2">
              <button
                className={`bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded ${isSelectedLayerLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={uploadPhotoImage}
                disabled={isSelectedLayerLocked}
              >
                Upload Photo Image
              </button>
              <button
                className={`bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded ${isSelectedLayerLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => rotateSelectedPhoto(-90)}
                disabled={isSelectedLayerLocked}
              >
                ↺ Rotate Left
              </button>
              <button
                className={`bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded ${isSelectedLayerLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => rotateSelectedPhoto(90)}
                disabled={isSelectedLayerLocked}
              >
                ↻ Rotate Right
              </button>
              <button
                className={`bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded ${isSelectedLayerLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => scaleSelectedPhoto(1.1)}
                disabled={isSelectedLayerLocked}
              >
                + Zoom In
              </button>
              <button
                className={`bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded ${isSelectedLayerLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => scaleSelectedPhoto(0.9)}
                disabled={isSelectedLayerLocked}
              >
                - Zoom Out
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Layers */}
        <div className="w-64 bg-gray-800 border-l border-gray-700">
          <div className="p-2">
            <div className="bg-gray-700 p-2 font-bold">Layers</div>

            <div className="mt-2 bg-gray-900 p-2 max-h-screen overflow-y-auto">
              {layers.sort((a, b) => b.zIndex - a.zIndex).map((layer) => (
                <div
                  key={layer.id}
                  className={`mb-2 rounded-md overflow-hidden ${selectedLayerId === layer.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div
                    className="bg-gray-800 p-2 flex items-center cursor-pointer"
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <div
                      className="mr-2 text-lg cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                    >
                      {layer.visible ? '👁️' : '🚫'}
                    </div>

                    {layer.locked && (
                      <div
                        className="mr-2 text-lg text-amber-500"
                        title="Layer is locked"
                      >
                        🔒
                      </div>
                    )}

                    {layer.type === "photo" && layer.photoId !== undefined && (
                      <div
                        className="w-8 h-8 flex items-center justify-center mr-2"
                        style={{
                          backgroundColor: photos.find(p => p.id === layer.photoId)?.color || "#ccc"
                        }}
                      >
                        <span className="text-white font-bold">{layer.photoId}</span>
                      </div>
                    )}

                    {layer.type === "frame" && (
                      <div className="w-8 h-8 border border-yellow-500 mr-2 bg-amber-100"></div>
                    )}

                    <div className="flex-grow text-sm">{layer.name}</div>

                    <div className="flex space-x-1">
                      <button
                        className="bg-gray-700 hover:bg-gray-600 p-1 rounded"
                        title="Move to Top"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerToTop(layer.id);
                        }}
                      >
                        ⬆️
                      </button>
                      <button
                        className="bg-gray-700 hover:bg-gray-600 p-1 rounded"
                        title="Move to Bottom"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerToBottom(layer.id);
                        }}
                      >
                        ⬇️
                      </button>
                      <button
                        className={`${layer.locked ? 'bg-amber-700' : 'bg-gray-700'} hover:bg-gray-600 p-1 rounded`}
                        title={layer.locked ? "Unlock" : "Lock"}
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedLayers = layers.map(l => {
                            if (l.id === layer.id) {
                              return { ...l, locked: !l.locked };
                            }
                            return l;
                          });
                          setLayers(updatedLayers);
                          addToHistory();
                        }}
                      >
                        {layer.locked ? '🔓' : '🔒'}
                      </button>
                      <button
                        className="bg-red-700 hover:bg-red-600 p-1 rounded"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (layer.locked) {
                            alert("Cannot delete a locked layer. Unlock it first.");
                            return;
                          }
                          if (confirm(`Delete ${layer.name}?`)) {
                            setSelectedLayerId(layer.id);
                            deleteSelectedLayer();
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {selectedLayerId === layer.id && (
                    <div className="bg-gray-700 p-2 text-xs">
                      {layer.type === "photo" && layer.photoId !== undefined && (
                        <>
                          <div className="mb-1">
                            <span className="text-gray-400">Position:</span>
                            {" "}
                            {Math.round(photos.find(p => p.id === layer.photoId)?.x || 0)},
                            {Math.round(photos.find(p => p.id === layer.photoId)?.y || 0)}
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Size:</span>
                            {" "}
                            {photos.find(p => p.id === layer.photoId)?.width || 0} ×
                            {photos.find(p => p.id === layer.photoId)?.height || 0} px
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Rotation:</span>
                            {" "}
                            {photos.find(p => p.id === layer.photoId)?.rotation || 0}°
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Scale:</span>
                            {" "}
                            {(photos.find(p => p.id === layer.photoId)?.scale || 1).toFixed(2)}x
                          </div>
                          <div>
                            <span className="text-gray-400">Image:</span>
                            {" "}
                            {photos.find(p => p.id === layer.photoId)?.imageData ? "Uploaded" : "None"}
                          </div>
                          <div className="mb-1 mt-2">
                            <span className="text-gray-400">Status:</span>
                            {" "}
                            {layer.locked ? "🔒 Locked" : "🔓 Unlocked"}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs w-full disabled:opacity-50"
                              onClick={() => centerSelectedLayer()}
                              disabled={layer.locked}
                            >
                              Center
                            </button>
                          </div>
                        </>
                      )}

                      {layer.type === "frame" && (
                        <>
                          <div className="mb-1">
                            <span className="text-gray-400">Position:</span>
                            {" "}
                            {framePos.x}, {framePos.y}
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Size:</span>
                            {" "}
                            {frameSize.width} × {frameSize.height} px
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Name:</span>
                            {" "}
                            {frameImage ? (frameImage.name || "Frame") : "No frame loaded"}
                          </div>
                          <div className="mb-1 mt-2">
                            <span className="text-gray-400">Status:</span>
                            {" "}
                            {layer.locked ? "🔒 Locked" : "🔓 Unlocked"}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs w-full disabled:opacity-50"
                              onClick={() => centerSelectedLayer()}
                              disabled={layer.locked}
                            >
                              Center
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {layers.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No layers yet. Add photos or a frame.
                </div>
              )}
            </div>

            <div className="mt-4 p-2 bg-gray-700">
              <div className="font-bold mb-2">Photo Information</div>
              <div className="text-sm text-gray-300">
                Photos: {photos.length}/8
              </div>
              <div className="text-sm text-gray-300">
                Total Layers: {layers.length}
              </div>
              <div className="text-sm text-gray-300">
                History States: {history.length}
              </div>
            </div>

            {/* Undo/Redo Controls */}
            <div className="mt-4 p-2 bg-gray-700">
              <div className="font-bold mb-2">History Controls</div>
              <div className="flex gap-2">
                <button
                  className="bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded text-xs flex-1 disabled:opacity-50"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  ↩️ Undo
                </button>
                <button
                  className="bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded text-xs flex-1 disabled:opacity-50"
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  ↪️ Redo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}