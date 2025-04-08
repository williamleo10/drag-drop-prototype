"use client";
import { useState, useEffect, useRef } from "react";

export default function DSLRBoothCompleteEditor() {
  const [isClient, setIsClient] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 276, height: 828 });
  const [frameImage, setFrameImage] = useState(null);
  const [framePos, setFramePos] = useState({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState({ width: 276, height: 828 });
  const [layers, setLayers] = useState([
    { id: 1, type: "frame", name: "Frame", visible: true, zIndex: 1 }
  ]);
  const [photos, setPhotos] = useState([]);
  const [photoImages, setPhotoImages] = useState({});
  const [selectedLayerId, setSelectedLayerId] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nextPhotoId, setNextPhotoId] = useState(1);
  const [nextLayerId, setNextLayerId] = useState(2);
  
  const canvasRef = useRef(null);
  const frameInputRef = useRef(null);
  const photoInputRef = useRef(null);
  
  // Warna untuk foto placeholder
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
  
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    const ctx = canvas.getContext('2d');
    
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
          ctx.strokeStyle = "#00AAFF";
          ctx.lineWidth = 2;
          ctx.strokeRect(framePos.x - 2, framePos.y - 2, frameSize.width + 4, frameSize.height + 4);
        }
      }
      else if (layer.type === "photo") {
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
          // Border around selected photo
          ctx.strokeStyle = "#FF0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -photo.width / 2 - 2, 
            -photo.height / 2 - 2, 
            photo.width + 4, 
            photo.height + 4
          );
          
          // Resize handles on corners
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
        
        ctx.restore();
      }
    });
  };
  
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if we clicked on anything
    let clickedLayerId = null;
    
    // Start from the topmost layer (highest zIndex) and work backwards
    const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      
      if (layer.type === "photo") {
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
    
    if (clickedLayerId) {
      setSelectedLayerId(clickedLayerId);
    } else {
      setSelectedLayerId(null);
    }
  };
  
  const handleMouseDown = (e) => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;
    
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
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    if (selectedLayer.type === "photo") {
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
    const newPhoto = {
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
    const newLayer = {
      id: nextLayerId,
      type: "photo",
      name: `Photo ${newPhotoId}`,
      visible: true,
      zIndex: layers.length + 1, // Place on top
      photoId: newPhotoId
    };
    
    setPhotos([...photos, newPhoto]);
    setLayers([...layers, newLayer]);
    setSelectedLayerId(nextLayerId);
    setNextPhotoId(newPhotoId + 1);
    setNextLayerId(nextLayerId + 1);
  };
  
  const uploadFrame = () => {
    frameInputRef.current?.click();
  };
  
  const handleFrameUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      
      // Update frame image with data
      setFrameImage({
        name: file.name,
        imageData
      });
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input
    e.target.value = null;
  };
  
  const uploadPhotoImage = () => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo") {
      alert("Please select a photo layer first.");
      return;
    }
    
    photoInputRef.current?.click();
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo") return;
    
    const photoId = selectedLayer.photoId;
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      
      // Update photo with image data
      const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            imageData
          };
        }
        return photo;
      });
      
      setPhotos(updatedPhotos);
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input
    e.target.value = null;
  };
  
  const deleteSelectedLayer = () => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;
    
    // Remove layer without restrictions
    const updatedLayers = layers.filter(l => l.id !== selectedLayerId);
    
    // Also remove the photo if it's a photo layer
    if (selectedLayer.type === "photo") {
      setPhotos(photos.filter(p => p.id !== selectedLayer.photoId));
    }
    
    setLayers(updatedLayers);
    
    // Select another layer if available
    if (updatedLayers.length > 0) {
      setSelectedLayerId(updatedLayers[updatedLayers.length - 1].id);
    } else {
      setSelectedLayerId(null);
    }
  };
  
  const toggleLayerVisibility = (layerId) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    });
    
    setLayers(updatedLayers);
  };
  
  const moveLayerToTop = (layerId) => {
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
    }
  };
  
  const moveLayerToBottom = (layerId) => {
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
    }
  };
  
  const rotateSelectedPhoto = (degrees) => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo") return;
    
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
  };
  
  const scaleSelectedPhoto = (factor) => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "photo") return;
    
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
  };
  
  const resizeCanvas = () => {
    const widthStr = prompt("Enter canvas width (pixels):", canvasSize.width.toString());
    const heightStr = prompt("Enter canvas height (pixels):", canvasSize.height.toString());
    
    const width = parseInt(widthStr || "276");
    const height = parseInt(heightStr || "828");
    
    if (width > 0 && height > 0) {
      setCanvasSize({ width, height });
      // Also resize the frame to match
      setFrameSize({ width, height });
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
    }
  };
  
  const addNewFrameLayer = () => {
    const newFrameLayer = {
      id: nextLayerId,
      type: "frame",
      name: "New Frame",
      visible: true,
      zIndex: layers.length + 1 // Place on top
    };
    
    setLayers([...layers, newFrameLayer]);
    setSelectedLayerId(nextLayerId);
    setNextLayerId(nextLayerId + 1);
  };
  
  if (!isClient) return null;
  
  // Create a scale factor for the display (to make tall canvas fit in viewport)
  const canvasDisplayScale = Math.min(1, 500 / canvasSize.height);
  
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
                cursor: isDragging ? "grabbing" : "grab"
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
              disabled={!selectedLayerId}
            >
              Delete Selected
            </button>
            <button 
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              onClick={exportCanvas}
            >
              Export Image
            </button>
          </div>
          
          {selectedLayerId && layers.find(l => l.id === selectedLayerId)?.type === "photo" && (
            <div className="flex gap-3 mt-2">
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
                onClick={uploadPhotoImage}
              >
                Upload Photo Image
              </button>
              <button 
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded"
                onClick={() => rotateSelectedPhoto(-90)}
              >
                ↺ Rotate Left
              </button>
              <button 
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded"
                onClick={() => rotateSelectedPhoto(90)}
              >
                ↻ Rotate Right
              </button>
              <button 
                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded"
                onClick={() => scaleSelectedPhoto(1.1)}
              >
                + Zoom In
              </button>
              <button 
                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded"
                onClick={() => scaleSelectedPhoto(0.9)}
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
                    
                    {layer.type === "photo" && (
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
                        className="bg-red-700 hover:bg-red-600 p-1 rounded" 
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${layer.name}?`)) {
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
                      {layer.type === "photo" && (
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
                          <div>
                            <span className="text-gray-400">Name:</span>
                            {" "}
                            {frameImage ? (frameImage.name || "Frame") : "No frame loaded"}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                      