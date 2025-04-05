"use client";
import { useState, useEffect } from "react";
import {
  DndContext,              // Area utama drag-and-drop
  PointerSensor,           // Sensor untuk mouse
  useSensor, useSensors,   // Aktifkan sensor
  closestCenter,           // Deteksi posisi drag terdekat
} from "@dnd-kit/core";

import {
  SortableContext,             // Buat daftar item bisa diurutkan
  verticalListSortingStrategy, // Strategi urutan vertikal
  useSortable,                 // Hook agar item bisa di-drag
  arrayMove                    // Untuk ubah urutan array
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

export default function DragDropPage() {
  const [isClient, setIsClient] = useState(false);

  // Data awal gambar
  const initialImages = [
    "image1.png",
    "image2.png",
    "image3.png",
    "image4.png",
    "image5.png",
    "image6.png",
    "image7.png",
    "image8.png",
  ];

  // State utama untuk menyimpan urutan gambar
  const [images, setImages] = useState(initialImages);

  // Aktifkan sensor drag pakai mouse
  const sensors = useSensors(useSensor(PointerSensor));

  // Inisialisasi ketika komponen dimuat
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Fungsi ketika drag selesai
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.indexOf(active.id);
    const newIndex = images.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setImages(arrayMove(images, oldIndex, newIndex)); // Atur ulang urutan
    }
  };

  // Bagi gambar menjadi kiri dan kanan
  const leftImages = images.slice(0, 4);
  const rightImages = images.slice(4, 8);

  // Komponen item drag
  const SortableItem = ({ id }: { id: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: "grab",
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-gray-200 rounded p-2 flex justify-center items-center h-52"
      >
        <Image
          src={`/images/${id}`}
          alt={id}
          width={100}
          height={100}
          className="rounded h-full w-full bg-fill bg-no-repeat bg-center"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-6">Photobooth Drag & Drop</h1>

      {/* Area utama drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Daftar item yang bisa di-drag */}
        <SortableContext items={images} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-2 gap-8">
            {/* Kolom Kiri */}
            <div className="bg-white p-4 rounded shadow min-h-[300px]">
              <h2 className="text-xl font-semibold mb-4">Kiri</h2>
              <div className="flex flex-col gap-4">
                {leftImages.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="bg-white p-4 rounded shadow min-h-[300px]">
              <h2 className="text-xl font-semibold mb-4">Kanan</h2>
              <div className="flex flex-col gap-4">
                {rightImages.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Output JSON */}
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Output JSON</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify([...leftImages, ...rightImages], null, 2)}
        </pre>
      </div>
    </div>
  );
}